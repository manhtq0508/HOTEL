const HoaDon = require("../models/HoaDon");
const PhieuThuePhong = require("../models/PhieuThuePhong");
const DichVu = require("../models/DichVu");
const SuDungDichVu = require("../models/SuDungDichVu");
const CaiDat = require("../models/CaiDat");
const invoiceService = require("../services/invoiceService");

exports.create = async (req, res, next) => {
  try {
    const result = await invoiceService.createInvoice(req.body, req.user);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
         success: false,
         message: err.message,
         errors: err.errors
      });
    }
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
    const result = await invoiceService.createCheckoutInvoice(req.body);
    res.status(201).json({
      success: true,
      message: "Hóa đơn checkout được tạo thành công với chi phí dịch vụ",
      data: result,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
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
      PhieuThuePhong: ptp._id,
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
