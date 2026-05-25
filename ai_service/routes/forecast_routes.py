from flask import Blueprint, jsonify
from ml.pipeline import (
    train_pipeline,
    auto_predict_pipeline,
    get_model_info,
    get_forecast_history,
    MODEL_PATH,   
)
import os

forecast_bp = Blueprint("forecast", __name__)


@forecast_bp.post("/forecast/train")
def train():
    """Train model SVR+GA. Không cần body."""
    try:
        result = train_pipeline(verbose=False)
        return jsonify({
            "status":        "success",
            "message":       "Train xong!",
            "trained_at":    result["trained_at"],
            "train_samples": result["train_samples"],
            "best_params":   result["best_params"],
            "metrics":       result["metrics"],
        }), 200
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@forecast_bp.post("/forecast/predict")
def predict():
    """
    Tự động lấy data tháng hiện tại từ DB, predict tháng tới.
    Không cần body — hoàn toàn tự động.
    """
    try:
        result = auto_predict_pipeline()
        return jsonify({"status": "success", **result}), 200
    except FileNotFoundError as e:
        return jsonify({"status": "error", "message": str(e)}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@forecast_bp.get("/forecast/status")
def status():
    """
    Kiểm tra model + trả về prediction mới nhất nếu có.
    Sạn 4: dùng MODEL_PATH đúng từ pipeline.py.
    """
    try:
        info = get_model_info()
        info["model_file_exists"] = os.path.exists(MODEL_PATH)

        # Thêm prediction mới nhất vào status
        history = get_forecast_history()
        if history:
            info["latest_forecast"] = history[-1]

        return jsonify(info), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@forecast_bp.get("/forecast/history")
def history():
    """Lịch sử toàn bộ dự báo đã thực hiện."""
    try:
        records = get_forecast_history()
        return jsonify({
            "status":  "success",
            "count":   len(records),
            "history": records,
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500