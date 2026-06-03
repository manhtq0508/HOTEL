const HoaDon         = require('../models/HoaDon');
const PhieuThuePhong = require('../models/PhieuThuePhong');
const SuDungDichVu   = require('../models/SuDungDichVu');
const CaiDat         = require('../models/CaiDat');

class InvoiceBuilder {
  constructor() {
    this._phieuId       = null;
    this._ptp           = null; 
    this._khachHang     = null;
    this._nhanVien      = null;
    this._phuongThuc    = null;
    this._tongTienPhong = 0;
    this._tongTienDichVu = 0;
    this._phuThu        = 0;
    this._tienBoiThuong = 0;
    this._tienDaCoc     = 0;
    this._chiTiet       = []; // ChiTietHoaDon lines
  }

  // ── fetch PhieuThuePhong, lấy KhachHang + TienCoc ──────────────────
  async setBooking(phieuId) {
    this._phieuId = phieuId;
    this._ptp = await PhieuThuePhong.findById(phieuId).populate({
      path: 'DatPhong',
      populate: { path: 'KhachHang' },
    });
    if (this._ptp) {
      this._khachHang  = this._ptp.DatPhong?.KhachHang?._id;
      this._tienDaCoc  = this._ptp.DatPhong?.TienCoc || 0;
    }
    return this;
  }

  // ──  tính tiền phòng (override nếu FE đã truyền) ────────────────────
  async calculateRoomCharges(overrideAmount = null) {
    const val = Number(overrideAmount);
    if (!isNaN(val) && val > 0) {
      this._tongTienPhong = val;
      return this;
    }
    if (!this._ptp) return this;

    let roomTypePrices = { Normal: 0, Standard: 0, Premium: 0, Luxury: 0 };
    try {
      const settings = await CaiDat.findOne({ Key: 'GeneralSettings' });
      if (settings?.GiaPhongCoBan) roomTypePrices = settings.GiaPhongCoBan;
    } catch (_) { /* giữ default */ }

    const ngayDen = new Date(this._ptp.DatPhong?.NgayDen);
    const ngayDi  = new Date(this._ptp.DatPhong?.NgayDi);
    const nights  = Math.max(1, Math.ceil((ngayDi - ngayDen) / 86_400_000));

    let rate = Number(this._ptp.DonGiaSauDieuChinh);
    if (!rate || rate <= 0) rate = roomTypePrices[this._ptp.DatPhong?.HangPhong] || 0;

    this._tongTienPhong = nights * rate;
    return this;
  }

  // ── gom dịch vụ đã hoàn thành ─────────────────────────────────────
  async addServiceUsages() {
    if (!this._ptp) return this;

    const usages = await SuDungDichVu.find({
      PhieuThuePhong: this._ptp._id,
      TrangThai: 'Completed',
    });

    this._tongTienDichVu = usages.reduce((s, u) => s + (u.ThanhTien || 0), 0);
    this._chiTiet = usages.map(u => ({
      MaCTHD:    u.MaSDDV || `CTHD${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      TenHang:   u.DichVu?.TenDV || 'Dịch vụ',
      SoLuong:   u.SoLuong,
      DonGia:    u.DonGia,
      ThanhTien: u.ThanhTien,
    }));
    return this;
  }

  // ── phụ thu / bồi thường / override cọc ────────────────────────────
  applyCharges({ PhuThu = 0, TienBoiThuong = 0, TienDaCoc } = {}) {
    this._phuThu        = Number(PhuThu)        || 0;
    this._tienBoiThuong = Number(TienBoiThuong) || 0;
    if (TienDaCoc !== undefined && TienDaCoc !== null && TienDaCoc !== '') {
      this._tienDaCoc = Number(TienDaCoc) || 0;
    }
    return this; // sync — không cần async
  }

  // ── nhân viên + phương thức thanh toán ─────────────────────────────
  setPayment({ NhanVienThuNgan, PhuongThucThanhToan }) {
    this._nhanVien   = NhanVienThuNgan;
    this._phuongThuc = PhuongThucThanhToan;
    return this;
  }

  // ── validate + sinh mã + lưu DB ────────────────────────────────────
  async build() {
    // Validate
    const errors = [];
    if (!this._phieuId)    errors.push('Vui lòng chọn Phiếu thuê phòng');
    if (!this._khachHang)  errors.push('Thiếu thông tin Khách hàng');
    if (!this._nhanVien)   errors.push('Thiếu thông tin Nhân viên thu ngân');
    if (!this._phuongThuc) errors.push('Vui lòng chọn Phương thức thanh toán');
    if (errors.length) throw { status: 400, message: 'Dữ liệu hóa đơn không đầy đủ', errors };

    // Sinh mã HD
    const count = await HoaDon.countDocuments();
    const MaHD  = `HD${String(count + 1).padStart(3, '0')}`;

    // Đảm bảo dòng tiền phòng luôn có trong chi tiết
    const finalDetails = [...this._chiTiet];
    if (this._tongTienPhong > 0) {
      finalDetails.unshift({
        MaCTHD:    `ROOM-${MaHD}-${Date.now()}`,
        TenHang:   'Tiền phòng',
        SoLuong:   1,
        DonGia:    this._tongTienPhong,
        ThanhTien: this._tongTienPhong,
      });
    }

    const TongThanhToan = Math.max(
      0,
      this._tongTienPhong + this._tongTienDichVu +
      this._phuThu + this._tienBoiThuong - this._tienDaCoc
    );

    const hoaDon = await HoaDon.create({
      MaHD,
      PhieuThuePhong:      this._phieuId,
      KhachHang:           this._khachHang,
      NhanVienThuNgan:     this._nhanVien,
      PhuongThucThanhToan: this._phuongThuc,
      NgayLap:             new Date(),
      TongTienPhong:       this._tongTienPhong,
      TongTienDichVu:      this._tongTienDichVu,
      PhuThu:              this._phuThu,
      TienBoiThuong:       this._tienBoiThuong,
      TienDaCoc:           this._tienDaCoc,
      TongThanhToan,
      TrangThaiThanhToan:  'Paid',
      ChiTietHoaDon:       finalDetails,
    });

    return hoaDon.populate(['PhieuThuePhong', 'NhanVienThuNgan', 'KhachHang', 'PhuongThucThanhToan']);
  }
}

module.exports = InvoiceBuilder;