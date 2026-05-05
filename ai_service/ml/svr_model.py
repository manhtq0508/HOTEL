"""
SVR model wrapper.
Bước 5: SVR cơ bản với params cố định.
Bước 6 sẽ dùng GA để tìm params tối ưu.
"""

import joblib
import os
import numpy as np
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error


# Default params - Bước 6 (GA) sẽ optimize các giá trị này
DEFAULT_PARAMS = {
    "C": 100.0,
    "epsilon": 0.1,
    "gamma": "scale",   # sklearn tự tính: 1 / (n_features * X.var())
    "kernel": "rbf"     # RBF kernel - chuẩn cho SVR theo paper
}


def train_svr(X_train: np.ndarray, y_train: np.ndarray, params: dict = None) -> SVR:
    """
    Train SVR model.

    Args:
        X_train: features đã normalized (shape: n_samples x 4)
        y_train: target Occupancy (shape: n_samples,)
        params: dict chứa C, epsilon, gamma. Nếu None → dùng DEFAULT_PARAMS

    Returns:
        model: SVR đã fit
    """
    p = {**DEFAULT_PARAMS, **(params or {})}

    model = SVR(
        kernel=p["kernel"],
        C=p["C"],
        epsilon=p["epsilon"],
        gamma=p["gamma"]
    )
    model.fit(X_train, y_train)
    return model


def predict_svr(model: SVR, X: np.ndarray) -> np.ndarray:
    """
    Predict Occupancy.

    Args:
        model: SVR đã train
        X: features đã normalized

    Returns:
        predictions: numpy array
    """
    return model.predict(X)


def evaluate_svr(model: SVR, X_test: np.ndarray, y_test: np.ndarray) -> dict:
    """
    Tính RMSE và MAPE.

    Returns:
        dict: {"rmse": float, "mape": float}
    """
    y_pred = predict_svr(model, X_test)

    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    # MAPE - tránh chia 0
    mask = y_test != 0
    mape = np.mean(np.abs((y_test[mask] - y_pred[mask]) / y_test[mask])) * 100

    return {"rmse": round(rmse, 4), "mape": round(mape, 4)}


def save_model(model: SVR, path: str) -> None:
    """Lưu model ra file .pkl"""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    joblib.dump(model, path)
    print(f"[SVR] Model saved → {path}")


def load_model(path: str) -> SVR:
    """Load model từ file .pkl"""
    if not os.path.exists(path):
        raise FileNotFoundError(f"Không tìm thấy model tại: {path}")
    return joblib.load(path)