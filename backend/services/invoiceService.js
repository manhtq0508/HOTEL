const HoaDon = require("../models/HoaDon");
const PhieuThuePhong = require("../models/PhieuThuePhong");
const DichVu = require("../models/DichVu");
const SuDungDichVu = require("../models/SuDungDichVu");
const CaiDat = require("../models/CaiDat");

exports.createInvoice = async (data, user) => {
    let {
      MaHD,
      PhieuThuePhong: phieuId,
      NhanVienThuNgan,
      KhachHang,
      PhuongThucThanhToan,
      TongTienPhong,
      TongTienDichVu,
      PhuThu,
      TienBoiThuong,
      TienDaCoc,
      ChiTietHoaDon,
    } = data;

    // 1. Auto-generate MaHD (HDXXX format)
    if (!MaHD || MaHD.startsWith("HD17")) { 
      const count = await HoaDon.countDocuments();
      MaHD = `HD${String(count + 1).padStart(3, "0")}`;
    }

    // Safety: Cleanup any existing records with corrupted null MaCTHD 
    try {
      await HoaDon.updateMany(
        { "ChiTietHoaDon.MaCTHD": null },
        { $pull: { ChiTietHoaDon: { MaCTHD: null } } }
      );
    } catch (e) { console.warn("Cleanup failed", e); }

    // 2. Booking-based auto-fill
    if (phieuId) {
      const ptp = await PhieuThuePhong.findById(phieuId).populate({
        path: "DatPhong",
        populate: { path: "KhachHang" },
      });

      if (ptp) {
        if (!KhachHang) KhachHang = ptp.DatPhong?.KhachHang?._id;
        
        // Auto-fill TienDaCoc if missing/empty
        if (TienDaCoc === undefined || TienDaCoc === null || TienDaCoc === "") {
          TienDaCoc = ptp.DatPhong?.TienCoc || 0;
        }

          let roomTypePrices = { Normal: 0, Standard: 0, Premium: 0, Luxury: 0 };
          try {
             const settings = await CaiDat.findOne({ Key: "GeneralSettings" });
             if (settings && settings.GiaPhongCoBan) {
               roomTypePrices = settings.GiaPhongCoBan;
             }
          } catch(err) { console.error("Error fetching settings for invoice:", err); }

        // Calculate booked nights from original booking dates
        if (TongTienPhong === undefined || TongTienPhong === null || TongTienPhong === "") {
          const ngayDen = new Date(ptp.DatPhong?.NgayDen);
          const ngayDi = new Date(ptp.DatPhong?.NgayDi);
          const bookedNights = Math.max(1, Math.ceil((ngayDi - ngayDen) / (1000 * 60 * 60 * 24)));
          
          const categoryRate = roomTypePrices[ptp.DatPhong?.HangPhong];
          let rate = Number(ptp.DonGiaSauDieuChinh);
          if (!rate || rate <= 0) {
            rate = categoryRate || 0;
          }
          
          TongTienPhong = bookedNights * rate;
        }

        // Fetch completed service usages for this rental receipt
        const serviceUsages = await SuDungDichVu.find({
          PhieuThuePhong: ptp._id,
          TrangThai: "Completed",
        });

        // Use database value if TongTienDichVu is not provided, is empty, or is 0
        if (TongTienDichVu === undefined || TongTienDichVu === null || TongTienDichVu === "" || Number(TongTienDichVu) === 0) {
          TongTienDichVu = serviceUsages.reduce(
            (sum, usage) => sum + (usage.ThanhTien || 0),
            0
          );
        }

        if (!ChiTietHoaDon || ChiTietHoaDon.length === 0) {
          ChiTietHoaDon = serviceUsages.map((usage) => ({
            MaCTHD: usage.MaSDDV || `CTHD${Date.now()}-${Math.random()}`,
            SoLuong: usage.SoLuong,
            DonGia: usage.DonGia,
            ThanhTien: usage.ThanhTien,
          }));
        }
      }
    }

    // 3. Staff fallback
    if ((!NhanVienThuNgan || NhanVienThuNgan === "") && user) {
      NhanVienThuNgan = user.id;
    }

    // 4. Numeric defaults & Numeric conversion
    TongTienPhong = Number(TongTienPhong) || 0;
    TongTienDichVu = Number(TongTienDichVu) || 0;
    PhuThu = Number(PhuThu) || 0;
    TienBoiThuong = Number(TienBoiThuong) || 0;
    TienDaCoc = Number(TienDaCoc) || 0;

    // 5. Validation after auto-fill
    const errors = [];
    if (!phieuId) errors.push("Vui lòng chọn Phiếu thuê phòng");
    if (!KhachHang) errors.push("Thiếu thông tin Khách hàng (không thể tự động lấy từ booking)");
    if (!NhanVienThuNgan) errors.push("Thiếu thông tin Nhân viên thu ngân");
    if (!PhuongThucThanhToan) errors.push("Vui lòng chọn Phương thức thanh toán");

    if (errors.length > 0) {
      throw {
        status: 400,
        message: "Dữ liệu hóa đơn không đầy đủ",
        errors,
      };
    }

    // 6. Total calculation
    const tongValue =
      TongTienPhong +
      TongTienDichVu +
      PhuThu +
      TienBoiThuong -
      TienDaCoc;

    const TongThanhToan = Math.max(0, tongValue);

    // 7. Payment status logic (AUTO-PAID)
    const status = "Paid";

    // Final sanitize ChiTietHoaDon
    let finalDetails = ChiTietHoaDon || [];
    if (finalDetails.length === 0 && TongTienPhong > 0) {
      finalDetails.push({
        MaCTHD: `ROOM-${MaHD}-${Date.now()}`,
        TenHang: "Tiền phòng",
        SoLuong: 1,
        DonGia: TongTienPhong,
        ThanhTien: TongTienPhong
      });
    }

    const hoaDon = await HoaDon.create({
      MaHD,
      PhieuThuePhong: phieuId,
      NhanVienThuNgan,
      KhachHang,
      NgayLap: new Date(),
      TongTienPhong,
      TongTienDichVu,
      PhuThu,
      TienBoiThuong,
      TienDaCoc,
      TongThanhToan,
      PhuongThucThanhToan,
      TrangThaiThanhToan: status,
      ChiTietHoaDon: finalDetails.map(item => ({
        ...item,
        MaCTHD: item.MaCTHD || `CTHD${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })),
    });

    return await hoaDon.populate([
      "PhieuThuePhong",
      "NhanVienThuNgan",
      "KhachHang",
      "PhuongThucThanhToan",
    ]);
};

exports.createCheckoutInvoice = async (data) => {
    const {
      PhieuThuePhong: phieuId,
      NhanVienThuNgan,
      KhachHang,
      PhuongThucThanhToan,
      TongTienPhong,
      PhuThu,
      TienBoiThuong,
      TienDaCoc,
    } = data;

    if (!phieuId || !NhanVienThuNgan || !KhachHang || !PhuongThucThanhToan) {
      throw { status: 400, message: "Missing required fields" };
    }

    // Fetch all completed service usages for this rental receipt
    const serviceUsages = await SuDungDichVu.find({
      PhieuThuePhong: phieuId,
      TrangThai: "Completed",
    });

    // Sum up service charges
    const TongTienDichVu = serviceUsages.reduce(
      (sum, usage) => sum + (usage.ThanhTien || 0),
      0
    );

    // Generate invoice code (HDXXX format)
    const count = await HoaDon.countDocuments();
    const MaHD = `HD${String(count + 1).padStart(3, "0")}`;

    // Calculate total
    const tong =
      (Number(TongTienPhong) || 0) +
      (Number(TongTienDichVu) || 0) +
      (Number(PhuThu) || 0) +
      (Number(TienBoiThuong) || 0) -
      (Number(TienDaCoc) || 0);

    // Map services
    let finalDetails = serviceUsages.map((usage) => ({
      MaCTHD: usage.MaSDDV || `CTHD${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      TenHang: usage.DichVu?.TenDV || "Dịch vụ",
      SoLuong: usage.SoLuong,
      DonGia: usage.DonGia,
      ThanhTien: usage.ThanhTien,
    }));

    // Add Room Revenue if not present
    if (Number(TongTienPhong) > 0) {
      finalDetails.unshift({
        MaCTHD: `ROOM-${MaHD}-${Date.now()}`,
        TenHang: "Tiền phòng",
        SoLuong: 1,
        DonGia: Number(TongTienPhong),
        ThanhTien: Number(TongTienPhong)
      });
    }

    const hoaDon = await HoaDon.create({
      MaHD,
      PhieuThuePhong: phieuId,
      NhanVienThuNgan,
      KhachHang,
      NgayLap: new Date(),
      TongTienPhong: TongTienPhong || 0,
      TongTienDichVu: TongTienDichVu,
      PhuThu: PhuThu || 0,
      TienBoiThuong: TienBoiThuong || 0,
      TienDaCoc: TienDaCoc || 0,
      TongThanhToan: Math.max(0, tong),
      PhuongThucThanhToan,
      TrangThaiThanhToan: "Paid",
      ChiTietHoaDon: finalDetails,
    });

    return await hoaDon.populate([
      "PhieuThuePhong",
      "NhanVienThuNgan",
      "KhachHang",
      "PhuongThucThanhToan",
    ]);
};
