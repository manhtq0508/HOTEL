"""
Pipeline kết hợp GA + SVR.

Luồng hoạt động:
1. Nhận data đã preprocessing
2. GA tìm params tối ưu (C, epsilon, gamma)
3. SVR train với params đó
4. Lưu model + scaler + params ra file
5. Trả về kết quả để backend dùng
"""

import joblib
import os
import json
from datetime import datetime
import pandas as pd

from ml.ga_optimizer import run_ga
from ml.svr_model import train_svr, evaluate_svr
from ml.preprocessing import run_preprocessing


# Thư mục lưu model
MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "svr_ga_model.pkl")
META_PATH  = os.path.join(MODEL_DIR, "model_meta.json")


def train_pipeline(verbose: bool = True) -> dict:
    """
    Chạy toàn bộ pipeline: load data → GA → SVR → lưu model.

    Returns:
        result: dict chứa params, metrics, thời gian train
    """

    # ── Bước 1: Load & preprocessing data ─────────────────────────────────
    if verbose:
        print("[Pipeline] Bước 1/3: Đang load và xử lý data...")

    X_train, X_test, y_train, y_test, scaler, df = run_preprocessing()

    if verbose:
        print(f"           Train: {X_train.shape[0]} tháng | "
              f"Test: {X_test.shape[0]} tháng")

    # ── Bước 2: GA tìm params tối ưu ──────────────────────────────────────
    if verbose:
        print("\n[Pipeline] Bước 2/3: GA đang tìm params tối ưu...")

    best_params = run_ga(X_train, y_train, verbose=verbose)

    # ── Bước 3: Train SVR với params tốt nhất ─────────────────────────────
    if verbose:
        print("\n[Pipeline] Bước 3/3: Train SVR với params từ GA...")

    model = train_svr(X_train, y_train, params=best_params)
    metrics = evaluate_svr(model, X_test, y_test)

    if verbose:
        print(f"           RMSE: {metrics['rmse']} | MAPE: {metrics['mape']}%")

    # ── Lưu model + scaler + metadata ─────────────────────────────────────
    os.makedirs(MODEL_DIR, exist_ok=True)

    # Lưu model và scaler vào 1 file (backend chỉ cần load 1 file)
    joblib.dump({"model": model, "scaler": scaler}, MODEL_PATH)

    # Lưu metadata ra JSON để dễ đọc (không cần load model để xem info)
    meta = {
        "trained_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "train_samples": int(X_train.shape[0]),
        "test_samples":  int(X_test.shape[0]),
        "best_params":   best_params,
        "metrics":       metrics,
    }
    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)

    if verbose:
        print(f"\n[Pipeline] ✅ Xong! Model lưu tại: {MODEL_PATH}")
        print(f"[Pipeline] ✅ Metadata lưu tại: {META_PATH}")

    return meta


def predict_pipeline(input_data: dict) -> dict:
    """
    Dự đoán Occupancy cho 1 tháng mới.

    Args:
        input_data: dict chứa các features, ví dụ:
            {
                "RoomSold": 46,
                "AvgRoomRate": 950000,
                "RevPAR": 200000,
                "RoomRev": 43700000
            }

    Returns:
        dict: {"predicted_occupancy": float, "unit": "%"}
    """

    # ── Load model ─────────────────────────────────────────────────────────
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            "Chưa có model! Hãy chạy train_pipeline() trước."
        )

    bundle = joblib.load(MODEL_PATH)
    model  = bundle["model"]
    scaler = bundle["scaler"]

    # ── Chuẩn bị input theo đúng thứ tự features ──────────────────────────
    # Thứ tự này phải khớp với FEATURE_COLS trong preprocessing.py
    feature_order = ["RoomSold", "AvgRoomRate", "RevPAR", "RoomRev"]

    try:
        X_raw = [[input_data[col] for col in feature_order]]
    except KeyError as e:
        raise ValueError(f"Thiếu feature: {e}. Cần có: {feature_order}")

    # ── Scale input (dùng scaler đã fit lúc train) ─────────────────────────
    # Tại sao phải scale? Vì model được train trên data đã scale,
    # nên input mới cũng phải scale theo cùng 1 scaler đó.
    import numpy as np
    X_scaled = scaler.transform(pd.DataFrame(X_raw, columns=feature_order))

    # ── Predict ────────────────────────────────────────────────────────────
    prediction = model.predict(X_scaled)[0]

    # Clip về [0, 100] vì Occupancy không thể âm hoặc > 100%
    prediction = float(np.clip(prediction, 0, 100))

    return {
        "predicted_occupancy": round(prediction, 2),
        "unit": "%"
    }


def get_model_info() -> dict:
    """
    Đọc metadata của model hiện tại (không cần load model).
    Backend dùng để hiển thị thông tin model cho user.
    """
    if not os.path.exists(META_PATH):
        return {"status": "no_model", "message": "Chưa có model nào được train."}

    with open(META_PATH, "r") as f:
        meta = json.load(f)

    meta["status"] = "ready"
    return meta

def get_current_month_features() -> dict:
    """
    Lấy data tháng hiện tại từ MongoDB để dự báo tháng tới.
    Không cần nhập tay — tự động lấy từ DB.

    Returns:
        dict: {RoomSold, AvgRoomRate, RevPAR, RoomRev, year_month}
    """
    from ml.data_loader import fetch_monthly_data
    import pandas as pd

    df = fetch_monthly_data()

    if df.empty:
        raise ValueError("Không có data trong DB.")

    # Lấy tháng mới nhất (tháng hiện tại)
    latest = df.iloc[-1]
    current_month = str(latest["year_month"])

    return {
        "RoomSold":    float(latest["RoomSold"]),
        "AvgRoomRate": float(latest["AvgRoomRate"]),
        "RevPAR":      float(latest["RevPAR"]),
        "RoomRev":     float(latest["RoomRev"]),
        "year_month":  current_month,
    }


def _generate_suggestion(occupancy: float, prev_occupancy: float = None) -> dict:
    """
    Tạo gợi ý hành động dựa trên Occupancy dự báo.

    Args:
        occupancy: % Occupancy dự báo tháng tới
        prev_occupancy: % Occupancy tháng hiện tại (để so sánh xu hướng)

    Returns:
        dict: {level, trend, suggestion, actions}
    """
    # Xác định mức độ
    if occupancy < 18:
        level = "low"
        level_label = "Thấp điểm"
        suggestion = "Tháng tới dự kiến vắng khách. Nên kích cầu sớm."
        actions = [
            "Tung khuyến mãi giảm giá 10-15% cho đặt phòng sớm",
            "Tăng cường marketing trên OTA (Booking.com, Agoda)",
            "Cân nhắc giảm nhân sự ca đêm để tiết kiệm chi phí",
        ]
    elif occupancy < 24:
        level = "normal"
        level_label = "Bình thường"
        suggestion = "Tháng tới dự kiến ổn định. Duy trì chiến lược hiện tại."
        actions = [
            "Giữ nguyên mức giá phòng hiện tại",
            "Đảm bảo nhân sự đủ theo lịch bình thường",
            "Theo dõi thêm 1-2 tuần để điều chỉnh nếu cần",
        ]
    else:
        level = "high"
        level_label = "Cao điểm"
        suggestion = "Tháng tới dự kiến đông khách. Chuẩn bị sẵn sàng."
        actions = [
            "Cân nhắc tăng giá phòng 10-15% vào cuối tuần",
            "Bố trí thêm nhân viên lễ tân và dọn phòng",
            "Kiểm tra tình trạng tất cả phòng, ưu tiên bảo trì sớm",
        ]

    # Tính xu hướng so với tháng hiện tại
    trend = None
    trend_label = None
    if prev_occupancy is not None:
        diff = occupancy - prev_occupancy
        if diff > 2:
            trend = "up"
            trend_label = f"↑ Tăng {diff:.1f}% so với tháng này"
        elif diff < -2:
            trend = "down"
            trend_label = f"↓ Giảm {abs(diff):.1f}% so với tháng này"
        else:
            trend = "stable"
            trend_label = f"→ Ổn định (±{abs(diff):.1f}%)"

    return {
        "level":       level,
        "level_label": level_label,
        "suggestion":  suggestion,
        "actions":     actions,
        "trend":       trend,
        "trend_label": trend_label,
    }


def auto_predict_pipeline() -> dict:
    """
    Tự động predict tháng tới dựa trên data tháng hiện tại.
    Đây là hàm chính được gọi từ API — không cần input từ user.

    Returns:
        dict: {
            predicted_occupancy,
            current_month,
            current_occupancy,
            suggestion: {level, suggestion, actions, trend, trend_label}
        }
    """
    from ml.data_loader import fetch_monthly_data
    import pandas as pd
    import numpy as np

    # Kiểm tra model đã train chưa
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            "Chưa có model! Hãy train model trước."
        )

    # Load model + scaler
    bundle = joblib.load(MODEL_PATH)
    model  = bundle["model"]
    scaler = bundle["scaler"]

    # Lấy toàn bộ data để có context
    df = fetch_monthly_data()
    if df.empty:
        raise ValueError("Không có data trong DB.")

    # Tháng hiện tại = dòng cuối cùng
    avg_rooms = df["RoomSold"].mean()
    if len(df) >= 2 and df.iloc[-1]["RoomSold"] < avg_rooms * 0.5:
        #Tháng hiện tại chưa đủ data → dùng tháng trước để predict
        latest = df.iloc[-2]
        prev_row = df.iloc[-3] if len(df) >= 3 else None
    else:
        latest = df.iloc[-1]
        prev_row = df.iloc[-2] if len(df) >= 2 else None

    current_month = str(latest["year_month"])
    current_occupancy = float(latest["Occupancy"])
    prev_occupancy = float(prev_row["Occupancy"]) if prev_row is not None else None

    # Lấy tháng trước đó để so sánh xu hướng (nếu có)
    prev_occupancy = float(df.iloc[-2]["Occupancy"]) if len(df) >= 2 else None

    # Chuẩn bị features
    feature_order = ["RoomSold", "AvgRoomRate", "RevPAR", "RoomRev"]
    X_raw = pd.DataFrame(
        [[float(latest[col]) for col in feature_order]],
        columns=feature_order
    )

    # Scale và predict
    X_scaled = scaler.transform(X_raw)
    prediction = float(np.clip(model.predict(X_scaled)[0], 0, 100))
    prediction = round(prediction, 2)

    # Tạo gợi ý
    suggestion = _generate_suggestion(prediction, current_occupancy)

    result = {
        "predicted_occupancy": prediction,
        "predicted_month":     _next_month_label(current_month),
        "current_month":       current_month,
        "current_occupancy":   round(current_occupancy, 2),
        "suggestion":          suggestion,
    }
    save_forecast_history(result)
    return result


def _next_month_label(year_month_str: str) -> str:
    """Tính nhãn tháng tiếp theo. VD: '2026-05' → '2026-06'"""
    from datetime import date
    import calendar
    try:
        year, month = map(int, year_month_str.split("-"))
        if month == 12:
            return f"{year + 1}-01"
        return f"{year}-{month + 1:02d}"
    except Exception:
        return "N/A"

def save_forecast_history(result: dict) -> None:
    """
    Lưu kết quả dự báo vào MongoDB để theo dõi lịch sử.
    Không mất lịch sử mỗi lần predict.
    """
    try:
        from db.mongo_client import get_db
        db = get_db()
        record = {
            **result,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
        # Dùng predicted_month làm key — mỗi tháng chỉ lưu 1 bản mới nhất
        db["forecast_history"].update_one(
            {"predicted_month": result["predicted_month"]},
            {"$set": record},
            upsert=True
        )
    except Exception as e:
        # Không để lỗi DB phá hỏng flow predict
        print(f"[Pipeline] ⚠️ Không lưu được lịch sử: {e}")


def get_forecast_history() -> list:
    """
    Lấy lịch sử dự báo từ MongoDB, sắp xếp theo tháng.
    """
    try:
        from db.mongo_client import get_db
        db = get_db()
        records = list(
            db["forecast_history"]
            .find({}, {"_id": 0})
            .sort("predicted_month", 1)
        )
        return records
    except Exception:
        return []