import sys
from datetime import datetime, timedelta
import random
from db.mongo_client import get_db
from bson import ObjectId
import calendar

random.seed(42)

db = get_db()

existing = db["phieuthuephongs"].count_documents({"is_sample_data": True})
print(f"PhieuThuePhong mẫu hiện tại: {existing} docs")

if existing >= 1000:
    print("Đã có đủ data mẫu. Không cần generate thêm.")
    sys.exit(0)

# 1. TẠO NHÂN VIÊN, KHÁCH HÀNG, PHÒNG (NẾU CHƯA CÓ)
if db["phongs"].count_documents({}) <= 10:
    print("Tạo sample Phong...")
    phong_docs = [{"_id": ObjectId(), "MaPhong": f"P{i:03d}", "LoaiPhong": random.choice(["Standard", "Deluxe", "Suite"]), "createdAt": datetime.now(), "updatedAt": datetime.now(), "__v": 0} for i in range(1, 21)]
    db["phongs"].insert_many(phong_docs)

if db["nhanviens"].count_documents({}) <= 10:
    print("Tạo sample NhanVien...")
    nhanvien_docs = [{"_id": ObjectId(), "MaNV": f"NV{i:03d}", "TenNV": f"NhanVien {i}", "createdAt": datetime.now(), "updatedAt": datetime.now(), "__v": 0} for i in range(1, 11)]
    db["nhanviens"].insert_many(nhanvien_docs)

if db["khachhangs"].count_documents({}) <= 50:
    print("Tạo sample KhachHang...")
    khachhang_docs = [{"_id": ObjectId(), "MaKH": f"KH{i:03d}", "TenKH": f"KhachHang {i}", "CMND": f"CMND{i:06d}", "Email": f"khachhang{i:03d}@example.com", "SoDienThoai": f"090{i:06d}", "createdAt": datetime.now(), "updatedAt": datetime.now(), "__v": 0} for i in range(1, 51)]
    db["khachhangs"].insert_many(khachhang_docs)

# 2. LẤY ID TỪ DB
phong_ids = [doc["_id"] for doc in db["phongs"].find({}, {"_id": 1})]
nhanvien_ids = [doc["_id"] for doc in db["nhanviens"].find({}, {"_id": 1})]
khachhang_ids = [doc["_id"] for doc in db["khachhangs"].find({}, {"_id": 1})]

if not phong_ids or not nhanvien_ids or not khachhang_ids:
    print("ERROR: Cần có Phong, NhanVien, KhachHang trong DB trước.")
    sys.exit(1)

total_rooms = len(phong_ids)
print(f"Tổng phòng: {total_rooms}")

# 3. TẠO DỮ LIỆU PHIẾU THUÊ PHÒNG (24 THÁNG)
start_date = datetime(2024, 1, 1)
records_added = 0

for month_offset in range(24):
    year = start_date.year + (start_date.month + month_offset - 1) // 12
    month = (start_date.month + month_offset - 1) % 12 + 1
    days_in_month = calendar.monthrange(year, month)[1]

    price_multiplier = 1.0  # Hệ số giá mặc định

    # ---------------------------------------------------------
    # TẠO ĐỘT BIẾN CHO THÁNG 10 VÀ THÁNG 11
    # ---------------------------------------------------------
    if month == 10:
        # Tháng 10: Đột biến tăng (Sự kiện lớn, full phòng)
        occupancy_target = random.uniform(0.95, 1.20)  # Có thể overbook hoặc turnover cực nhanh
        price_multiplier = 1.50  # Giá phòng tăng 50%
        event_tag = " (ĐỘT BIẾN TĂNG)"
    elif month == 11:
        # Tháng 11: Đột biến giảm (Thời tiết xấu, bão, hoặc sửa chữa)
        occupancy_target = random.uniform(0.10, 0.20)  # Vắng khách thê thảm
        price_multiplier = 0.70  # Giảm giá 30% kích cầu nhưng vẫn ế
        event_tag = " (ĐỘT BIẾN GIẢM)"
    else:
        # Các tháng còn lại bình thường theo mùa vụ
        event_tag = ""
        if month in [6, 7, 8, 12]:
            occupancy_target = random.uniform(0.70, 0.90)  # Mùa cao điểm
        elif month in [4, 5, 9]:
            occupancy_target = random.uniform(0.50, 0.70)  # Mùa trung bình
        else:
            occupancy_target = random.uniform(0.30, 0.55)  # Mùa thấp điểm

    # Tính toán số lần check-in dựa trên occupancy_target
    n_checkins = int(occupancy_target * total_rooms * days_in_month / 3)  # avg 3 đêm/lần
    n_checkins = max(1, n_checkins)

    ptp_docs = []
    for _ in range(n_checkins):
        check_in_day = random.randint(1, days_in_month)
        stay_nights = random.randint(1, 5)
        check_out_day = min(check_in_day + stay_nights, days_in_month)

        check_in_dt = datetime(year, month, check_in_day)
        check_out_dt = datetime(year, month, check_out_day)

        # Giá phòng theo loại có áp dụng hệ số đột biến
        base_prices = [500000, 700000, 900000, 1200000, 1500000]
        gia_goc = random.choice(base_prices)
        gia_cuoi_cung = int(gia_goc * price_multiplier)

        ptp_docs.append({
            "_id": ObjectId(),
            "MaPTP": f"SMP-{year}{month:02d}-{_ + 1:03d}",
            "DatPhong": ObjectId(),  # fake reference
            "Phong": random.choice(phong_ids),
            "NgayNhanPhong": check_in_dt,
            "NgayTraDuKien": check_out_dt,
            "SoKhachThucTe": random.randint(1, 3),
            "DonGiaSauDieuChinh": gia_cuoi_cung,
            "NhanVienCheckIn": random.choice(nhanvien_ids),
            "TrangThai": "CheckedOut",
            "is_sample_data": True,
            "createdAt": check_in_dt,
            "updatedAt": check_out_dt,
            "__v": 0,
        })

    if ptp_docs:
        db["phieuthuephongs"].insert_many(ptp_docs)
        records_added += len(ptp_docs)

    print(f"  {year}-{month:02d}: occupancy ~{occupancy_target:.0%}, {len(ptp_docs)} records{event_tag}")

print(f"\n✅ Đã thêm {records_added} records mẫu vào phieuthuephongs")
print("Chạy lại: python test_preprocessing.py")