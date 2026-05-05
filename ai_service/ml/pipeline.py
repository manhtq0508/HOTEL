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