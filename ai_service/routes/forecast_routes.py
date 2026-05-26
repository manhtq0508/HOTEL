from flask import Blueprint, request, jsonify

from ml.weekly_svr_ga import (
    train_weekly_pipeline,
    forecast_weekly_with_model,
    get_weekly_model_info,
)

forecast_bp = Blueprint("forecast", __name__)


@forecast_bp.post("/forecast/train")
def train():
    """
    Train WEEKLY model (SVR+GA autoregressive) từ data trong MongoDB.

    Note: Monthly forecast endpoints have been deprecated.
    """
    try:
        result = train_weekly_pipeline(verbose=False)
        return jsonify({
            "status": "success",
            "message": "Train xong!",
            "trained_at": result.get("trained_at"),
            "train_samples": result.get("train_samples"),
            "best_params": result.get("best_params"),
            "metrics": result.get("metrics"),
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

@forecast_bp.get("/forecast/predict/weekly")
def predict_weekly():
    """Dự đoán Occupancy theo TUẦN cho nhiều tuần liên tục.

    Query params:
      - count: số tuần muốn dự báo (default 24 ~ 6 tháng)
      - lags: số lag tuần dùng làm feature (default 8)
    """
    try:
        count = request.args.get("count", default=24, type=int)
        lags = request.args.get("lags", default=8, type=int)

        count = max(1, min(104, int(count)))
        lags = max(2, min(26, int(lags)))

        result = forecast_weekly_with_model(weeks_ahead=count, n_lags=lags)

        return jsonify({
            "status": "success",
            "unit": "%",
            "granularity": "week",
            "history_weeks": result.history_weeks,
            "start_week": result.start_week,
            "predicted_series": result.predicted_series,
        }), 200

    except ValueError as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

    except FileNotFoundError as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 404

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
        info = get_weekly_model_info()
        return jsonify(info), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500