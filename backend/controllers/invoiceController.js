const HoaDon = require("../models/HoaDon");
const PhieuThuePhong = require("../models/PhieuThuePhong");
const DichVu = require("../models/DichVu");
const SuDungDichVu = require("../models/SuDungDichVu");
const CaiDat = require("../models/CaiDat");

exports.create = async (req, res, next) => {
  try {
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
    } = req.body;

    // 1. Auto-generate MaHD (HDXXX format)
    if (!MaHD || MaHD.startsWith("HD17")) { 
      const count = await HoaDon.countDocuments();
      MaHD = `HD${String(count + 1).padStart(3, "0")}`;
    }

    // Safety: Cleanup any existing records with corrupted null MaCTHD 
    // to prevent duplicate key errors from old failed attempts
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

        // Fetch completed services
        const serviceUsages = await SuDungDichVu.find({
          PhieuThuePhong: phieuId,
          TrangThai: "Completed",
        });

        if (TongTienDichVu === undefined || TongTienDichVu === null || TongTienDichVu === "") {
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

    // 3. Staff fallback (if missing, null, or empty string)
    if ((!NhanVienThuNgan || NhanVienThuNgan === "") && req.user) {
      NhanVienThuNgan = req.user.id;
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
      return res.status(400).json({
        success: false,
        message: "Dữ liệu hóa đơn không đầy đủ",
        errors,
      });
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
    // As requested: If balance <= 0 -> Paid, Else -> Paid
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

    const result = await hoaDon.populate([
      "PhieuThuePhong",
      "NhanVienThuNgan",
      "KhachHang",
      "PhuongThucThanhToan",
    ]);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const list = await HoaDon.find()
      .populate([
        "PhieuThuePhong",
        "NhanVienThuNgan",
        "KhachHang",
        "PhuongThucThanhToan",
      ])
      .limit(200);
    res.json(list);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const hoaDon = await HoaDon.findById(req.params.id).populate([
      "PhieuThuePhong",
      "NhanVienThuNgan",
      "KhachHang",
      "PhuongThucThanhToan",
    ]);
    if (!hoaDon) return res.status(404).json({ message: "Invoice not found" });
    res.json(hoaDon);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const hoaDon = await HoaDon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate([
      "PhieuThuePhong",
      "NhanVienThuNgan",
      "KhachHang",
      "PhuongThucThanhToan",
    ]);
    if (!hoaDon) return res.status(404).json({ message: "Invoice not found" });
    res.json(hoaDon);
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const hoaDon = await HoaDon.findByIdAndDelete(req.params.id);
    if (!hoaDon) return res.status(404).json({ message: "Invoice not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Auto-create invoice at checkout with service charges
exports.createCheckoutInvoice = async (req, res, next) => {
  try {
    const {
      PhieuThuePhong: phieuId,
      NhanVienThuNgan,
      KhachHang,
      PhuongThucThanhToan,
      TongTienPhong,
      PhuThu,
      TienBoiThuong,
      TienDaCoc,
    } = req.body;

    if (!phieuId || !NhanVienThuNgan || !KhachHang || !PhuongThucThanhToan) {
      return res.status(400).json({ message: "Missing required fields" });
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

    const result = await hoaDon.populate([
      "PhieuThuePhong",
      "NhanVienThuNgan",
      "KhachHang",
      "PhuongThucThanhToan",
    ]);
    res.status(201).json({
      success: true,
      message: "Hóa đơn checkout được tạo thành công với chi phí dịch vụ",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

exports.getPreview = async (req, res, next) => {
  try {
    const { phieuId } = req.query;
    if (!phieuId) {
      return res.status(400).json({ message: "phieuId is required" });
    }

    const ptp = await PhieuThuePhong.findById(phieuId).populate({
      path: "DatPhong",
      populate: { path: "KhachHang" },
    });

    if (!ptp) {
      return res.status(404).json({ message: "Rental receipt not found" });
    }

    let roomTypePrices = { Normal: 0, Standard: 0, Premium: 0, Luxury: 0 };
    try {
        const settings = await CaiDat.findOne({ Key: "GeneralSettings" });
        if (settings && settings.GiaPhongCoBan) {
          roomTypePrices = settings.GiaPhongCoBan;
        }
    } catch(err) { console.error("Error fetching settings for invoice preview:", err); }
    // CRITICAL BUSINESS RULE: Price based on BOOKED duration, NOT actual stay
    // Calculate booked nights from original booking dates
    const ngayDen = new Date(ptp.DatPhong?.NgayDen);
    const ngayDi = new Date(ptp.DatPhong?.NgayDi);
    const bookedNights = Math.max(1, Math.ceil((ngayDi - ngayDen) / (1000 * 60 * 60 * 24)));
    
    const categoryRate = roomTypePrices[ptp.DatPhong?.HangPhong];
    let rate = Number(ptp.DonGiaSauDieuChinh);
    if (!rate || rate <= 0) {
      rate = categoryRate || 0;
    }
    const TongTienPhong = bookedNights * rate;

    const serviceUsages = await SuDungDichVu.find({
      PhieuThuePhong: phieuId,
      TrangThai: "Completed",
    });
    const TongTienDichVu = serviceUsages.reduce(
      (sum, usage) => sum + (usage.ThanhTien || 0),
      0
    );
    const TienDaCoc = ptp.DatPhong?.TienCoc || 0;
    const KhachHangRecord = ptp.DatPhong?.KhachHang;

    res.json({
      success: true,
      data: {
        KhachHang: KhachHangRecord?._id,
        HoTenKhachHang: KhachHangRecord?.HoTen,
        TongTienPhong,
        TongTienDichVu,
        TienDaCoc,
        PhieuThuePhong: phieuId,
      },
    });
  } catch (err) {
    next(err);
  }
};
