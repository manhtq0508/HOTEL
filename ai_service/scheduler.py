"""
scheduler.py
Auto-train model mỗi đầu tháng + auto-predict ngay sau đó.

Tại sao cần scheduler?
- Không cần quản lý nhớ bấm nút train
- Mỗi đầu tháng có data mới → tự động retrain → model luôn fresh
- Predict ngay sau train → dashboard luôn có kết quả mới nhất
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging

logger = logging.getLogger(__name__)


def monthly_retrain_job():
    """
    Job chạy lúc 2:00 AM ngày 1 mỗi tháng:
    1. Retrain model với data mới nhất
    2. Predict tháng tới ngay
    3. Lưu kết quả vào MongoDB
    """
    from ml.pipeline import train_pipeline, auto_predict_pipeline

    logger.info("[Scheduler] Bắt đầu monthly retrain...")
    try:
        meta = train_pipeline(verbose=False)
        logger.info(f"[Scheduler] Train xong. RMSE={meta['metrics']['rmse']}")
    except Exception as e:
        logger.error(f"[Scheduler] Train thất bại: {e}")
        return

    try:
        result = auto_predict_pipeline()
        logger.info(
            f"[Scheduler] Predict xong. "
            f"Tháng {result['predicted_month']}: "
            f"{result['predicted_occupancy']}%"
        )
    except Exception as e:
        logger.error(f"[Scheduler] Predict thất bại: {e}")


def start_scheduler():
    """Khởi động scheduler. Gọi 1 lần khi app start."""
    scheduler = BackgroundScheduler()

    # Chạy lúc 2:00 AM ngày 1 mỗi tháng
    scheduler.add_job(
        monthly_retrain_job,
        trigger=CronTrigger(day=1, hour=2, minute=0),
        id="monthly_retrain",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("[Scheduler] ✅ Đã khởi động. Job: mùng 1 hàng tháng lúc 2:00 AM")
    return scheduler