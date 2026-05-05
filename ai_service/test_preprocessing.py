from ml.preprocessing import run_preprocessing

X_train, X_test, y_train, y_test, scaler, df = run_preprocessing()
print("Shape train:", X_train.shape)
print("Shape test:", X_test.shape)
print("Occupancy range:", y_train.min(), "-", y_train.max())
print(df.head())
