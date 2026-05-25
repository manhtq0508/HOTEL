# test_all_fixes.py
import requests

BASE = "http://localhost:8000/api"

print("=" * 55)
print("TEST 1: Status (Sạn 4 — đúng MODEL_PATH)")
print("=" * 55)
r = requests.get(f"{BASE}/forecast/status")
d = r.json()
print(f"model_file_exists : {d.get('model_file_exists')}")
print(f"status            : {d.get('status')}")
print(f"latest_forecast   : {d.get('latest_forecast')}")

print("\n" + "=" * 55)
print("TEST 2: Predict tự động (Sạn 1 + 5)")
print("=" * 55)
r = requests.post(f"{BASE}/forecast/predict")
d = r.json()
print(f"status             : {d.get('status')}")
print(f"current_month      : {d.get('current_month')}")
print(f"current_occupancy  : {d.get('current_occupancy')}%")
print(f"predicted_month    : {d.get('predicted_month')}")
print(f"predicted_occupancy: {d.get('predicted_occupancy')}%")
s = d.get("suggestion", {})
print(f"level              : {s.get('level_label')}")
print(f"trend              : {s.get('trend_label')}")
print(f"suggestion         : {s.get('suggestion')}")
print(f"actions            : {s.get('actions')}")

print("\n" + "=" * 55)
print("TEST 3: History (Sạn 6 — lưu lịch sử)")
print("=" * 55)
r = requests.get(f"{BASE}/forecast/history")
d = r.json()
print(f"status : {d.get('status')}")
print(f"count  : {d.get('count')} bản ghi")
for rec in d.get("history", []):
    print(f"  {rec.get('predicted_month')}: {rec.get('predicted_occupancy')}%")

print("\n" + "=" * 55)
print("TEST 4: Predict lần 2 (verify lịch sử không bị xóa)")
print("=" * 55)
requests.post(f"{BASE}/forecast/predict")
r = requests.get(f"{BASE}/forecast/history")
d = r.json()
print(f"count sau predict lần 2: {d.get('count')} (phải = 1, không tăng)")

print("\n✅ Xong tất cả!")