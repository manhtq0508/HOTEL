from flask import Blueprint, request, jsonify
from ml.pipeline import train_pipeline, predict_pipeline, get_model_info

forecast_bp = Blueprint("forecast", __name__)


@forecast_bp.post("/forecast/train")
def train():
    """
    Train model SVR+GA từ data trong MongoDB.
    Không cần body — data được load trực tiếp từ DB.

    Tại sao không nhận data qua body?
    - Data đã có sẵn trong MongoDB (backend đã lưu vào đó)
    - Tránh gửi data lớn qua HTTP không cần thiết
    - pipeline.py tự biết cách load từ DB
    """
    try:
        result = train_pipeline(verbose=False)  # verbose=False vì đang chạy qua API
        return jsonify({
            "status": "success",
            "message": "Train xong!",
            "trained_at":    result["trained_at"],
            "train_samples": result["train_samples"],
            "best_params":   result["best_params"],
            "metrics":       result["metrics"]
        }), 200

    except ValueError as e:
        # Lỗi do data không đủ hoặc không hợp lệ
        return jsonify({
            "status": "error",
            "message": f"Lỗi data: {str(e)}"
        }), 400

    except Exception as e:
        # Lỗi không mong đợi
        return jsonify({
            "status": "error",
            "message": f"Lỗi server: {str(e)}"
        }), 500


@forecast_bp.post("/forecast/predict")
def predict():
    """
    Dự đoán Occupancy cho 1 tháng.

    Body (JSON):
    {
        "RoomSold":    46,
        "AvgRoomRate": 958695,
        "RevPAR":      200000,
        "RoomRev":     44100000
    }
    """
    try:
        body = request.get_json()

        # Kiểm tra body có tồn tại không
        if not body:
            return jsonify({
                "status": "error",
                "message": "Thiếu request body (JSON)"
            }), 400

        result = predict_pipeline(input_data=body)

        return jsonify({
            "status": "success",
            "predicted_occupancy": result["predicted_occupancy"],
            "unit": result["unit"]
        }), 200

    except FileNotFoundError as e:
        # Model chưa được train
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 404

    except ValueError as e:
        # Thiếu feature hoặc input sai
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Lỗi server: {str(e)}"
        }), 500


@forecast_bp.get("/forecast/status")
def status():
    """
    Kiểm tra model đã train chưa + xem thông tin model hiện tại.
    Backend dùng endpoint này để biết có thể predict chưa.
    """
    try:
        info = get_model_info()
        return jsonify(info), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500