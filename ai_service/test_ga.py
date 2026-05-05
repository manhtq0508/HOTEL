from ml.preprocessing import run_preprocessing
from ml.ga_optimizer import run_ga
from ml.svr_model import train_svr, evaluate_svr

X_train, X_test, y_train, y_test, scaler, df = run_preprocessing()

print("=== Chạy GA để tìm params tối ưu ===")
print(f"Population: 20 | Generations: 50\n")

best_params = run_ga(X_train, y_train, verbose=True)

print("\n=== Train SVR với params từ GA ===")
model = train_svr(X_train, y_train, params=best_params)
metrics = evaluate_svr(model, X_test, y_test)

print(f"\nRMSE (GA-SVR): {metrics['rmse']}")
print(f"MAPE (GA-SVR): {metrics['mape']}%")