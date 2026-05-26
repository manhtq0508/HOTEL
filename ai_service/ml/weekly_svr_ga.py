"""Weekly occupancy forecasting using SVR optimized by GA.

This module trains an autoregressive SVR model on weekly occupancy history:
- Target: occupancy (%) per week
- Features: lag values (n_lags) + simple seasonality (sin/cos of week-of-year)

A trained model is persisted under `models/` and used by the weekly predict API.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timedelta

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import MinMaxScaler
from sklearn.svm import SVR

from ml.ga_optimizer_ts import run_ga_time_series
from ml.weekly_forecast import fetch_weekly_occupancy_series


MODEL_DIR = "models"
WEEKLY_MODEL_PATH = os.path.join(MODEL_DIR, "svr_ga_weekly_model.pkl")
WEEKLY_META_PATH = os.path.join(MODEL_DIR, "model_meta_weekly.json")


@dataclass(frozen=True)
class WeeklyForecastResult:
    history_weeks: int
    start_week: str
    predicted_series: list[float]


def _build_supervised_matrix(series: pd.Series, n_lags: int) -> tuple[np.ndarray, np.ndarray, pd.DatetimeIndex]:
    if n_lags < 2:
        raise ValueError("n_lags phải >= 2")

    s = series.dropna().astype(float)
    if len(s) <= n_lags + 4:
        raise ValueError(
            f"Không đủ data để train weekly SVR (cần > {n_lags + 4} tuần, hiện có {len(s)})."
        )

    y_all = s.values
    idx_all = s.index

    X_rows: list[list[float]] = []
    y_rows: list[float] = []
    idx_rows: list[pd.Timestamp] = []

    for t in range(n_lags, len(y_all)):
        lags = y_all[t - n_lags : t].tolist()
        week_start = pd.Timestamp(idx_all[t])

        iso_week = int(week_start.isocalendar().week)
        angle = 2 * np.pi * (iso_week / 52.0)
        sin_w = float(np.sin(angle))
        cos_w = float(np.cos(angle))

        X_rows.append(lags + [sin_w, cos_w])
        y_rows.append(float(y_all[t]))
        idx_rows.append(week_start)

    X = np.asarray(X_rows, dtype=float)
    y = np.asarray(y_rows, dtype=float)
    idx = pd.DatetimeIndex(idx_rows)
    return X, y, idx


def _train_test_split_time_order(X: np.ndarray, y: np.ndarray, test_weeks: int) -> tuple:
    n = len(y)
    test_weeks = int(max(4, min(test_weeks, max(4, n // 3))))
    split = n - test_weeks
    return X[:split], X[split:], y[:split], y[split:]


def train_weekly_pipeline(*, n_lags: int = 8, test_weeks: int = 12, verbose: bool = True) -> dict:
    """Train weekly forecasting model (SVR + GA) and persist to disk."""

    series = fetch_weekly_occupancy_series()
    X, y, _idx = _build_supervised_matrix(series, n_lags=n_lags)

    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = _train_test_split_time_order(X_scaled, y, test_weeks=test_weeks)

    if verbose:
        print(
            f"[WeeklyPipeline] Train weeks: {len(y_train)} | Test weeks: {len(y_test)} | lags={n_lags}"
        )

    best_params = run_ga_time_series(
        X_train,
        y_train,
        config={
            # keep it reasonably fast for daily retrains
            "population_size": 16,
            "n_generations": 20,
            "cv_splits": 5,
        },
        verbose=verbose,
    )

    model = SVR(
        kernel=best_params["kernel"],
        C=best_params["C"],
        epsilon=best_params["epsilon"],
        gamma=best_params["gamma"],
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))

    # MAPE - avoid division by 0
    mask = y_test != 0
    mape = float(np.mean(np.abs((y_test[mask] - y_pred[mask]) / y_test[mask])) * 100) if np.any(mask) else 0.0

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(
        {
            "model": model,
            "scaler": scaler,
            "n_lags": int(n_lags),
        },
        WEEKLY_MODEL_PATH,
    )

    meta = {
        "status": "ready",
        "trained_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "history_weeks": int(len(series)),
        "supervised_samples": int(len(y)),
        "train_samples": int(len(y_train)),
        "test_samples": int(len(y_test)),
        "n_lags": int(n_lags),
        "best_params": best_params,
        "metrics": {
            "rmse": round(rmse, 4),
            "mape": round(mape, 4),
        },
    }

    with open(WEEKLY_META_PATH, "w") as f:
        json.dump(meta, f, indent=2)

    if verbose:
        print(f"[WeeklyPipeline] ✅ Saved model: {WEEKLY_MODEL_PATH}")
        print(f"[WeeklyPipeline] ✅ Saved meta : {WEEKLY_META_PATH}")

    return meta


def get_weekly_model_info() -> dict:
    if not os.path.exists(WEEKLY_META_PATH):
        return {"status": "no_model", "message": "Chưa có weekly model nào được train."}
    with open(WEEKLY_META_PATH, "r") as f:
        meta = json.load(f)
    meta.setdefault("status", "ready")
    return meta


def forecast_weekly_with_model(*, weeks_ahead: int = 24, n_lags: int | None = None) -> WeeklyForecastResult:
    """Forecast future weeks using the persisted weekly SVR+GA model."""

    if not os.path.exists(WEEKLY_MODEL_PATH):
        raise FileNotFoundError("Chưa có weekly model! Hãy train trước.")

    bundle = joblib.load(WEEKLY_MODEL_PATH)
    model: SVR = bundle["model"]
    scaler: MinMaxScaler = bundle["scaler"]
    trained_lags = int(bundle.get("n_lags", 8))

    series = fetch_weekly_occupancy_series()
    if series is None or len(series) == 0:
        raise ValueError("Không có dữ liệu weekly occupancy để dự báo.")

    lags = int(n_lags or trained_lags)
    lags = max(2, min(26, lags))

    if len(series) < lags:
        raise ValueError(f"Không đủ history để dự báo (cần {lags} tuần, hiện có {len(series)}).")

    weeks_ahead = int(max(1, min(104, weeks_ahead)))

    history = series.astype(float).tolist()

    last_week_start = pd.Timestamp(series.index.max())
    start_week = (last_week_start + timedelta(days=7)).date().isoformat()

    preds: list[float] = []

    for i in range(weeks_ahead):
        next_week_start = last_week_start + timedelta(days=7 * (i + 1))

        lag_vals = history[-lags:]
        iso_week = int(next_week_start.isocalendar().week)
        angle = 2 * np.pi * (iso_week / 52.0)
        sin_w = float(np.sin(angle))
        cos_w = float(np.cos(angle))

        x = np.asarray([lag_vals + [sin_w, cos_w]], dtype=float)
        x_scaled = scaler.transform(x)
        yhat = float(model.predict(x_scaled)[0])
        yhat = float(np.clip(yhat, 0, 100))
        yhat = round(yhat, 2)

        preds.append(yhat)
        history.append(yhat)

    return WeeklyForecastResult(
        history_weeks=int(len(series)),
        start_week=start_week,
        predicted_series=preds,
    )
