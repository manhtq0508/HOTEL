"""
Script tạo dữ liệu mẫu thực tế (24 tháng) để test ML pipeline.

Lý do cần script này:
- DB hiện tại chỉ có 2 tháng data
- SVR cần ít nhất 12-24 tháng để học được pattern
- Script này KHÔNG xóa data thật, chỉ thêm vào
- Sau khi có data thật đủ, có thể xóa data mẫu này

Chạy: python generate_sample_data.py
"""
import sys
from datetime import datetime, timedelta
import random
from db.mongo_client import get_db
from bson import ObjectId
import calendar

random.seed(42)

db = get_db()

# Kiểm tra xem đã có đủ data chưa
existing = db["phieuthuephongs"].count_documents({})
print(f"PhieuThuePhong hiện tại: {existing} docs")

if existing >= 100:
    print("Đã có đủ data. Không cần generate thêm.")
    sys.exit(0)

# Tạo nhân viên, khách hàng, phòng nếu chưa có
if db["phongs"].count_documents({}) <= 10:
    print("Tạo sample Phong...")
    phong_docs = []
    for i in range(1, 21):
        phong_docs.append({
            "_id": ObjectId(),
            "MaPhong": f"P{i:03d}",
            "LoaiPhong": random.choice(["Standard", "Deluxe", "Suite"]),
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
            "__v": 0,
        })
    db["phongs"].insert_many(phong_docs)

if db["nhanviens"].count_documents({}) <= 10:
    print("Tạo sample NhanVien...")
    nhanvien_docs = []
    for i in range(1, 11):
        nhanvien_docs.append({
            "_id": ObjectId(),
            "MaNV": f"NV{i:03d}",
            "TenNV": f"NhanVien {i}",
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
            "__v": 0,
        })
    db["nhanviens"].insert_many(nhanvien_docs)

if db["khachhangs"].count_documents({}) <= 50:
    print("Tạo sample KhachHang...")
    khachhang_docs = []
    for i in range(1, 51):
        khachhang_docs.append({
            "_id": ObjectId(),
            "MaKH": f"KH{i:03d}",
            "TenKH": f"KhachHang {i}",
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
            "__v": 0,
        })
    db["khachhangs"].insert_many(khachhang_docs)

# Lấy ID phòng và nhân viên thật từ DB
phong_ids = [doc["_id"] for doc in db["phongs"].find({}, {"_id": 1})]
nhanvien_ids = [doc["_id"] for doc in db["nhanviens"].find({}, {"_id": 1})]
khachhang_ids = [doc["_id"] for doc in db["khachhangs"].find({}, {"_id": 1})]

if not phong_ids or not nhanvien_ids or not khachhang_ids:
    print("ERROR: Cần có Phong, NhanVien, KhachHang trong DB trước.")
    sys.exit(1)

total_rooms = len(phong_ids)
print(f"Tổng phòng: {total_rooms}")

# Tạo PhieuThuePhong giả cho 24 tháng trước
start_date = datetime(2024, 1, 1)
records_added = 0

for month_offset in range(24):
    year = start_date.year + (start_date.month + month_offset - 1) // 12
    month = (start_date.month + month_offset - 1) % 12 + 1
    days_in_month = calendar.monthrange(year, month)[1]

    # Tỷ lệ lấp đầy theo mùa (realistics hotel pattern)
    # Mùa cao: tháng 6-8, tháng 12
    # Mùa thấp: tháng 1-3
    if month in [6, 7, 8, 12]:
        occupancy_target = random.uniform(0.70, 0.90)
    elif month in [4, 5, 9, 10, 11]:
        occupancy_target = random.uniform(0.50, 0.70)
    else:
        occupancy_target = random.uniform(0.30, 0.55)

    # Số lần check-in trong tháng
    n_checkins = int(occupancy_target * total_rooms * days_in_month / 3)  # avg 3 đêm/lần
    n_checkins = max(1, n_checkins)

    ptp_docs = []
    for _ in range(n_checkins):
        check_in_day = random.randint(1, days_in_month)
        stay_nights = random.randint(1, 5)
        check_out_day = min(check_in_day + stay_nights, days_in_month)

        check_in_dt = datetime(year, month, check_in_day)
        check_out_dt = datetime(year, month, check_out_day)

        # Giá phòng theo loại
        base_prices = [500000, 700000, 900000, 1200000, 1500000]
        gia = random.choice(base_prices)

        ptp_docs.append({
            "_id": ObjectId(),
            "MaPTP": f"SMP-{year}{month:02d}-{_ + 1:03d}",
            "DatPhong": ObjectId(),  # fake reference
            "Phong": random.choice(phong_ids),
            "NgayNhanPhong": check_in_dt,
            "NgayTraDuKien": check_out_dt,
            "SoKhachThucTe": random.randint(1, 3),
            "DonGiaSauDieuChinh": gia,
            "NhanVienCheckIn": random.choice(nhanvien_ids),
            "TrangThai": "CheckedOut",  # sample data đều CheckedOut
            "is_sample_data": True,    # tag để phân biệt với data thật
            "createdAt": check_in_dt,
            "updatedAt": check_out_dt,
            "__v": 0,
        })

    if ptp_docs:
        db["phieuthuephongs"].insert_many(ptp_docs)
        records_added += len(ptp_docs)

    print(f"  {year}-{month:02d}: occupancy ~{occupancy_target:.0%}, {len(ptp_docs)} records")

print(f"\n✅ Đã thêm {records_added} records mẫu vào phieuthuephongs")
print("Chạy lại: python test_preprocessing.py")
