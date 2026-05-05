from ml.preprocessing import run_preprocessing
from ml.svr_model import train_svr, evaluate_svr, save_model

# Load data đã preprocessing
X_train, X_test, y_train, y_test, scaler, df = run_preprocessing()

print(f"Train: {X_train.shape} | Test: {X_test.shape}")

# Train SVR với default params
model = train_svr(X_train, y_train)
print("Train xong!")

# Evaluate
metrics = evaluate_svr(model, X_test, y_test)
print(f"RMSE: {metrics['rmse']}")
print(f"MAPE: {metrics['mape']}%")

# Kiểm tra predict thử
import numpy as np
y_pred = model.predict(X_test)
print("\nSo sánh Actual vs Predicted:")
for actual, pred in zip(y_test, y_pred):
    print(f"  Actual: {actual:.2f}%  |  Predicted: {pred:.2f}%")

# Save model
save_model(model, "models/svr_basic.pkl")