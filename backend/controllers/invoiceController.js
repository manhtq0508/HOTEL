const HoaDon = require("../models/HoaDon");
const PhieuThuePhong = require("../models/PhieuThuePhong");
const DichVu = require("../models/DichVu");
const SuDungDichVu = require("../models/SuDungDichVu");

exports.create = async (req, res, next) => {
  try {
    const {
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
    } = req.body;

    if (
      !MaHD ||
      !phieuId ||
      !NhanVienThuNgan ||
      !KhachHang ||
      !PhuongThucThanhToan
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const tong =
      (TongTienPhong || 0) +
      (TongTienDichVu || 0) +
      (PhuThu || 0) +
      (TienBoiThuong || 0) -
      (TienDaCoc || 0);

    const hoaDon = await HoaDon.create({
      MaHD,
      PhieuThuePhong: phieuId,
      NhanVienThuNgan,
      KhachHang,
      NgayLap: new Date(),
      TongTienPhong: TongTienPhong || 0,
      TongTienDichVu: TongTienDichVu || 0,
      PhuThu: PhuThu || 0,
      TienBoiThuong: TienBoiThuong || 0,
      TienDaCoc: TienDaCoc || 0,
      TongThanhToan: Math.max(0, tong),
      PhuongThucThanhToan,
      ChiTietHoaDon: req.body.ChiTietHoaDon || [],
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

    // Generate invoice code
    const MaHD = "HD" + Date.now();

    // Calculate total
    const tong =
      (TongTienPhong || 0) +
      (TongTienDichVu || 0) +
      (PhuThu || 0) +
      (TienBoiThuong || 0) -
      (TienDaCoc || 0);

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
      ChiTietHoaDon: serviceUsages.map((usage) => ({
        TenHang: usage.DichVu?.TenDV || "Dịch vụ",
        SoLuong: usage.SoLuong,
        DonGia: usage.DonGia,
        ThanhTien: usage.ThanhTien,
      })),
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
