const LichSuDatPhong = require('../models/LichSuDatPhong');

// Get all booking history
exports.getAllBookingHistory = async (req, res) => {
  try {
    const history = await LichSuDatPhong.find()
      .populate('DatPhong')
      .populate('TaiKhoan', 'TenDangNhap');
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch sử đặt phòng thành công',
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lịch sử đặt phòng',
      error: error.message
    });
  }
};

// Get booking history by ID
exports.getBookingHistoryById = async (req, res) => {
  try {
    const record = await LichSuDatPhong.findById(req.params.id)
      .populate('DatPhong')
      .populate('TaiKhoan', 'TenDangNhap');
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Lịch sử đặt phòng không tồn tại'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Lấy thông tin lịch sử đặt phòng thành công',
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin lịch sử đặt phòng',
      error: error.message
    });
  }
};

// Get booking history by DatPhong ID
exports.getHistoryByBookingId = async (req, res) => {
  try {
    const history = await LichSuDatPhong.find({ DatPhong: req.params.bookingId })
      .populate('DatPhong')
      .populate('TaiKhoan', 'TenDangNhap')
      .sort({ ThoiGian: -1 });
    res.status(200).json({
      success: true,
      message: 'Lấy lịch sử đặt phòng thành công',
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử đặt phòng',
      error: error.message
    });
  }
};

// Create new booking history record
exports.createBookingHistory = async (req, res) => {
  try {
    const { MaLSDP, DatPhong, TrangThaiCu, TrangThaiMoi, TaiKhoan } = req.body;

    // Validate input
    if (!MaLSDP || !DatPhong || !TrangThaiCu || !TrangThaiMoi) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đủ thông tin lịch sử đặt phòng'
      });
    }

    // Check if record code already exists
    const existingRecord = await LichSuDatPhong.findOne({ MaLSDP });
    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: 'Mã lịch sử đặt phòng đã tồn tại'
      });
    }

    const record = new LichSuDatPhong({
      MaLSDP,
      DatPhong,
      TrangThaiCu,
      TrangThaiMoi,
      TaiKhoan: TaiKhoan || null
    });

    await record.save();
    await record.populate('DatPhong');
    await record.populate('TaiKhoan', 'TenDangNhap');

    res.status(201).json({
      success: true,
      message: 'Tạo lịch sử đặt phòng thành công',
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lịch sử đặt phòng',
      error: error.message
    });
  }
};

// Delete booking history record
exports.deleteBookingHistory = async (req, res) => {
  try {
    const record = await LichSuDatPhong.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Lịch sử đặt phòng không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa lịch sử đặt phòng thành công',
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lịch sử đặt phòng',
      error: error.message
    });
  }
};
