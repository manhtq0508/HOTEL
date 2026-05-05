from ml.pipeline import train_pipeline, predict_pipeline, get_model_info

# ── Test 1: Train ──────────────────────────────────────────────────────────
print("=" * 50)
print("TEST 1: Train pipeline")
print("=" * 50)
result = train_pipeline(verbose=True)

# ── Test 2: Xem thông tin model ────────────────────────────────────────────
print("\n" + "=" * 50)
print("TEST 2: Model info")
print("=" * 50)
info = get_model_info()
print(f"Trained at  : {info['trained_at']}")
print(f"Train samples: {info['train_samples']} tháng")
print(f"Best params : {info['best_params']}")
print(f"Metrics     : {info['metrics']}")

# ── Test 3: Predict ────────────────────────────────────────────────────────
print("\n" + "=" * 50)
print("TEST 3: Predict 1 tháng mới")
print("=" * 50)

sample_input = {
    "RoomSold":    46,
    "AvgRoomRate": 958695,
    "RevPAR":      200000,
    "RoomRev":     44100000
}

prediction = predict_pipeline(sample_input)
print(f"Input   : {sample_input}")
print(f"Dự đoán : Occupancy = {prediction['predicted_occupancy']}%")