import pandas as pd
from db.mongo_client import get_db
import calendar


# Đặt tên collection đúng với MongoDB (Mongoose auto-pluralize + lowercase)
COL_PHIEU = "phieuthuephongs"
COL_DATPHONG = "datphongs"
COL_PHONG = "phongs"
COL_HOADON = "hoadons"


def fetch_monthly_data() -> pd.DataFrame:
    """
    Kéo data từ MongoDB, tổng hợp theo tháng.

    Returns:
        DataFrame với các cột:
        [year_month, RoomSold, AvgRoomRate, RoomRev, RevPAR, Occupancy]
    """
    db = get_db()

    # 1. Tổng số phòng
    total_rooms = db[COL_PHONG].count_documents({})
    if total_rooms == 0:
        raise ValueError("Không có phòng nào trong database.")

    # 2. Lấy PhieuThuePhong (cả CheckedIn lẫn CheckedOut)
    pipeline_ptp = [
        {
            "$lookup": {
                "from": COL_DATPHONG,
                "localField": "DatPhong",
                "foreignField": "_id",
                "as": "dat_phong"
            }
        },
        {"$unwind": {"path": "$dat_phong", "preserveNullAndEmptyArrays": True}},
        {
            "$project": {
                "NgayNhanPhong": 1,
                "DonGiaSauDieuChinh": 1,
                "TrangThai": 1,
            }
        }
    ]
    ptp_docs = list(db[COL_PHIEU].aggregate(pipeline_ptp))

    # 3. Lấy HoaDon đã Paid
    hd_docs = list(db[COL_HOADON].find(
        {"TrangThaiThanhToan": "Paid"},
        {"NgayLap": 1, "TongTienPhong": 1}
    ))

    if not ptp_docs:
        raise ValueError(
            "Không có dữ liệu PhieuThuePhong. "
            "Vui lòng chạy script tạo dữ liệu mẫu: python generate_sample_data.py"
        )

    # 4. Build DataFrame phòng
    rooms_rows = []
    for doc in ptp_docs:
        if doc.get("NgayNhanPhong"):
            rooms_rows.append({
                "year_month": pd.Timestamp(doc["NgayNhanPhong"]).to_period("M"),
                "DonGia": float(doc.get("DonGiaSauDieuChinh") or 0),
            })

    if not rooms_rows:
        raise ValueError("Không parse được NgayNhanPhong từ PhieuThuePhong.")

    rooms_df = pd.DataFrame(rooms_rows)

    # 5. Build DataFrame hóa đơn
    inv_rows = []
    for doc in hd_docs:
        if doc.get("NgayLap"):
            inv_rows.append({
                "year_month": pd.Timestamp(doc["NgayLap"]).to_period("M"),
                "TongTienPhong": float(doc.get("TongTienPhong") or 0),
            })

    # 6. Tổng hợp theo tháng
    monthly_rooms = rooms_df.groupby("year_month").agg(
        RoomSold=("DonGia", "count"),
        AvgRoomRate=("DonGia", "mean"),
    ).reset_index()

    if inv_rows:
        invoices_df = pd.DataFrame(inv_rows)
        monthly_inv = invoices_df.groupby("year_month").agg(
            RoomRev=("TongTienPhong", "sum"),
        ).reset_index()
        monthly = pd.merge(monthly_rooms, monthly_inv, on="year_month", how="left")
    else:
        monthly = monthly_rooms.copy()
        monthly["RoomRev"] = monthly["AvgRoomRate"] * monthly["RoomSold"]

    monthly["RoomRev"] = monthly["RoomRev"].fillna(0)

    # 7. Tính RevPAR và Occupancy
    def days_in_period(period):
        return calendar.monthrange(period.year, period.month)[1]

    monthly["RevPAR"] = monthly["RoomRev"] / total_rooms
    monthly["DaysInMonth"] = monthly["year_month"].apply(days_in_period)
    monthly["Occupancy"] = (
        monthly["RoomSold"] / (total_rooms * monthly["DaysInMonth"]) * 100
    ).clip(0, 100)

    monthly = monthly.sort_values("year_month").reset_index(drop=True)
    monthly = monthly.drop(columns=["DaysInMonth"])

    return monthly
