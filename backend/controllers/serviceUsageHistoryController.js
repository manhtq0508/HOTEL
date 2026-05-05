const LichSuSuDungDichVu = require('../models/LichSuSuDungDichVu');

// Get all service usage history
exports.getAllServiceUsageHistory = async (req, res) => {
  try {
    const history = await LichSuSuDungDichVu.find()
      .populate('SuDungDichVu')
      .populate('TaiKhoan', 'TenDangNhap');
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch sử sử dụng dịch vụ thành công',
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lịch sử sử dụng dịch vụ',
      error: error.message
    });
  }
};

// Get service usage history by ID
exports.getServiceUsageHistoryById = async (req, res) => {
  try {
    const record = await LichSuSuDungDichVu.findById(req.params.id)
      .populate('SuDungDichVu')
      .populate('TaiKhoan', 'TenDangNhap');
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Lịch sử sử dụng dịch vụ không tồn tại'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Lấy thông tin lịch sử sử dụng dịch vụ thành công',
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin lịch sử sử dụng dịch vụ',
      error: error.message
    });
  }
};

// Get service usage history by SuDungDichVu ID
exports.getHistoryByServiceUsageId = async (req, res) => {
  try {
    const history = await LichSuSuDungDichVu.find({ SuDungDichVu: req.params.serviceUsageId })
      .populate('SuDungDichVu')
      .populate('TaiKhoan', 'TenDangNhap')
      .sort({ ThoiGian: -1 });
    res.status(200).json({
      success: true,
      message: 'Lấy lịch sử sử dụng dịch vụ thành công',
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử sử dụng dịch vụ',
      error: error.message
    });
  }
};

// Create new service usage history record
exports.createServiceUsageHistory = async (req, res) => {
  try {
    const { MaLSDV, SuDungDichVu, TrangThaiCu, TrangThaiMoi, TaiKhoan } = req.body;

    // Validate input
    if (!MaLSDV || !SuDungDichVu || !TrangThaiCu || !TrangThaiMoi) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đủ thông tin lịch sử sử dụng dịch vụ'
      });
    }

    // Check if record code already exists
    const existingRecord = await LichSuSuDungDichVu.findOne({ MaLSDV });
    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: 'Mã lịch sử sử dụng dịch vụ đã tồn tại'
      });
    }

    const record = new LichSuSuDungDichVu({
      MaLSDV,
      SuDungDichVu,
      TrangThaiCu,
      TrangThaiMoi,
      TaiKhoan: TaiKhoan || null
    });

    await record.save();
    await record.populate('SuDungDichVu');
    await record.populate('TaiKhoan', 'TenDangNhap');

    res.status(201).json({
      success: true,
      message: 'Tạo lịch sử sử dụng dịch vụ thành công',
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lịch sử sử dụng dịch vụ',
      error: error.message
    });
  }
};

// Update service usage history status
exports.updateServiceUsageHistory = async (req, res) => {
  try {
    const { TrangThaiMoi } = req.body;

    if (!TrangThaiMoi) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái mới'
      });
    }

    const record = await LichSuSuDungDichVu.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Lịch sử sử dụng dịch vụ không tồn tại'
      });
    }

    // Update with old status as previous new status
    record.TrangThaiCu = record.TrangThaiMoi;
    record.TrangThaiMoi = TrangThaiMoi;
    await record.save();

    await record.populate('SuDungDichVu');
    await record.populate('TaiKhoan', 'TenDangNhap');

    res.status(200).json({
      success: true,
      message: 'Cập nhật lịch sử sử dụng dịch vụ thành công',
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật lịch sử sử dụng dịch vụ',
      error: error.message
    });
  }
};

// Delete service usage history record
exports.deleteServiceUsageHistory = async (req, res) => {
  try {
    const record = await LichSuSuDungDichVu.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Lịch sử sử dụng dịch vụ không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa lịch sử sử dụng dịch vụ thành công',
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lịch sử sử dụng dịch vụ',
      error: error.message
    });
  }
};
