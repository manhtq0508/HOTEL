import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import joblib
import os

# Các cột feature dùng để predict
FEATURE_COLS = ["RoomSold", "AvgRoomRate", "RevPAR", "RoomRev"]
TARGET_COL = "Occupancy"


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Làm sạch data:
    - Xóa dòng có giá trị null ở các cột quan trọng
    - Xóa dòng có Occupancy <= 0 hoặc > 100 (vô lý)
    - Xóa outlier bằng IQR method cho từng feature
    """
    # Xóa null
    cols_needed = FEATURE_COLS + [TARGET_COL]
    df = df.dropna(subset=cols_needed).copy()

    # Xóa Occupancy vô lý
    df = df[(df[TARGET_COL] > 0) & (df[TARGET_COL] <= 100)]

    # Xóa outlier bằng IQR (chỉ áp dụng cho features, không áp dụng cho target)
    for col in FEATURE_COLS:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        df = df[(df[col] >= lower) & (df[col] <= upper)]

    return df.reset_index(drop=True)


def normalize(df: pd.DataFrame, scaler_path: str = None):
    """
    Chuẩn hóa features bằng MinMaxScaler (scale về [0, 1]).

    Tại sao MinMaxScaler?
    - SVR nhạy cảm với scale của features
    - MinMax phù hợp khi data không có outlier cực đoan (đã clean rồi)

    Returns:
        df_scaled: DataFrame đã scale
        scaler: scaler object (dùng để inverse_transform khi predict)
    """
    scaler = MinMaxScaler()
    df_scaled = df.copy()
    df_scaled[FEATURE_COLS] = scaler.fit_transform(df[FEATURE_COLS])

    if scaler_path:
        os.makedirs(os.path.dirname(scaler_path), exist_ok=True)
        joblib.dump(scaler, scaler_path)

    return df_scaled, scaler


def load_scaler(scaler_path: str) -> MinMaxScaler:
    """Load scaler đã lưu từ file."""
    return joblib.load(scaler_path)


def split_train_test(df: pd.DataFrame, test_size: float = 0.2):
    """
    Tách train/test theo thứ tự THỜI GIAN (không shuffle).

    Tại sao không shuffle?
    - Data này là time-series (theo tháng)
    - Nếu shuffle → data leakage: model "biết" tương lai khi train
    - Luôn lấy phần cuối làm test set

    Returns:
        X_train, X_test, y_train, y_test (numpy arrays)
    """
    n = len(df)
    if n < 6:
        raise ValueError(f"Không đủ data để train (cần ít nhất 6 tháng, hiện có {n}).")

    split_idx = int(n * (1 - test_size))

    train = df.iloc[:split_idx]
    test = df.iloc[split_idx:]

    X_train = train[FEATURE_COLS].values
    y_train = train[TARGET_COL].values
    X_test = test[FEATURE_COLS].values
    y_test = test[TARGET_COL].values

    return X_train, X_test, y_train, y_test


def run_preprocessing(scaler_path: str = None):
    """
    Pipeline đầy đủ: load → clean → normalize → split.

    Returns:
        X_train, X_test, y_train, y_test, scaler, df_clean
    """
    from ml.data_loader import fetch_monthly_data

    df_raw = fetch_monthly_data()
    df_clean = clean_data(df_raw)
    df_scaled, scaler = normalize(df_clean, scaler_path=scaler_path)
    X_train, X_test, y_train, y_test = split_train_test(df_scaled)

    return X_train, X_test, y_train, y_test, scaler, df_clean
