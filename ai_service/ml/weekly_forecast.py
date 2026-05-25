import math
from dataclasses import dataclass
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from db.mongo_client import get_db


COL_PHIEU = "phieuthuephongs"
COL_PHONG = "phongs"


@dataclass(frozen=True)
class WeeklyForecastResult:
    history_weeks: int
    start_week: str
    predicted_series: list[float]


def _to_datetime(value) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return pd.to_datetime(value).to_pydatetime()
    except Exception:
        return None


def _week_start_monday(dt: datetime) -> datetime:
    d = datetime(dt.year, dt.month, dt.day)
    return d - timedelta(days=d.weekday())


def fetch_weekly_occupancy_series() -> pd.Series:
    """Build weekly occupancy time series from MongoDB.

    Occupancy definition:
      occupancy_week = room_nights / (total_rooms * 7) * 100

    room_nights counts each room-night within the week.
    """

    db = get_db()

    total_rooms = db[COL_PHONG].count_documents({})
    if total_rooms == 0:
        raise ValueError("Không có phòng nào trong database.")

    cursor = db[COL_PHIEU].find(
        {},
        {
            "NgayNhanPhong": 1,
            "NgayTraDuKien": 1,
        },
    )

    nights = []
    for doc in cursor:
        check_in = _to_datetime(doc.get("NgayNhanPhong"))
        check_out = _to_datetime(doc.get("NgayTraDuKien"))
        if not check_in or not check_out:
            continue

        # Normalize to date; treat check_out as exclusive
        start = datetime(check_in.year, check_in.month, check_in.day)
        end = datetime(check_out.year, check_out.month, check_out.day)
        if end <= start:
            continue

        days = (end - start).days
        # Guard for pathological data
        if days > 60:
            days = 60

        for i in range(days):
            nights.append(start + timedelta(days=i))

    if not nights:
        raise ValueError(
            "Không có dữ liệu PhieuThuePhong hợp lệ để tính occupancy theo tuần."
        )

    nights_df = pd.DataFrame({"night": pd.to_datetime(nights)})
    # Week starts on Monday (00:00). Keep index aligned with date_range(freq='W-MON').
    nights_df["date"] = nights_df["night"].dt.normalize()
    nights_df["week_start"] = nights_df["date"] - pd.to_timedelta(
        nights_df["date"].dt.weekday, unit="D"
    )

    room_nights_per_week = (
        nights_df.groupby("week_start").size().sort_index().astype(float)
    )

    occupancy = (room_nights_per_week / (total_rooms * 7.0) * 100.0).clip(0, 100)

    # Ensure continuous weekly index (fill missing weeks with 0)
    full_index = pd.date_range(
        start=occupancy.index.min(), end=occupancy.index.max(), freq="W-MON"
    )
    occupancy = occupancy.reindex(full_index, fill_value=0.0)
    occupancy.index.name = "week_start"

    return occupancy


def _build_supervised(series: pd.Series, n_lags: int) -> tuple[np.ndarray, np.ndarray, list[pd.Timestamp]]:
    values = series.values.astype(float)
    idx = list(series.index)

    X_rows = []
    y = []
    target_indexes: list[pd.Timestamp] = []

    for t in range(n_lags, len(values)):
        lag_values = values[t - n_lags : t][::-1]  # lag1..lagN

        week_dt = pd.Timestamp(idx[t])
        week_of_year = int(week_dt.isocalendar().week)
        sin_w = math.sin(2 * math.pi * week_of_year / 52.0)
        cos_w = math.cos(2 * math.pi * week_of_year / 52.0)

        X_rows.append(np.concatenate([lag_values, [sin_w, cos_w]]))
        y.append(values[t])
        target_indexes.append(week_dt)

    return np.array(X_rows, dtype=float), np.array(y, dtype=float), target_indexes


def forecast_weekly_occupancy(weeks_ahead: int = 24, n_lags: int = 8) -> WeeklyForecastResult:
    series = fetch_weekly_occupancy_series()

    if len(series) < n_lags + 8:
        raise ValueError(
            f"Không đủ data theo tuần để dự báo (cần ít nhất {n_lags + 8} tuần, hiện có {len(series)})."
        )

    X, y, target_indexes = _build_supervised(series, n_lags=n_lags)

    model: Pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("ridge", Ridge(alpha=1.0, random_state=42)),
        ]
    )
    model.fit(X, y)

    history_values = series.values.astype(float)
    history_index = list(series.index)

    preds: list[float] = []
    last_values = history_values.copy().tolist()
    last_week = pd.Timestamp(history_index[-1])

    for step in range(int(weeks_ahead)):
        next_week = last_week + pd.Timedelta(days=7)
        week_of_year = int(next_week.isocalendar().week)
        sin_w = math.sin(2 * math.pi * week_of_year / 52.0)
        cos_w = math.cos(2 * math.pi * week_of_year / 52.0)

        lag_values = np.array(last_values[-n_lags:][::-1], dtype=float)
        x = np.concatenate([lag_values, [sin_w, cos_w]]).reshape(1, -1)

        pred = float(model.predict(x)[0])
        pred = float(np.clip(pred, 0, 100))
        pred = round(pred, 2)

        preds.append(pred)
        last_values.append(pred)
        last_week = next_week

    start_week = (pd.Timestamp(history_index[-1]) + pd.Timedelta(days=7)).date().isoformat()

    return WeeklyForecastResult(
        history_weeks=int(len(series)),
        start_week=start_week,
        predicted_series=preds,
    )
