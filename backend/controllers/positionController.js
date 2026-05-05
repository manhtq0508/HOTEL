const ChucVu = require('../models/ChucVu');

// Get all positions
exports.getAllPositions = async (req, res) => {
  try {
    const positions = await ChucVu.find();
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách chức vụ thành công',
      data: positions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách chức vụ',
      error: error.message
    });
  }
};

// Get position by ID
exports.getPositionById = async (req, res) => {
  try {
    const position = await ChucVu.findById(req.params.id);
    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Chức vụ không tồn tại'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Lấy thông tin chức vụ thành công',
      data: position
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chức vụ',
      error: error.message
    });
  }
};

// Create new position
exports.createPosition = async (req, res) => {
  try {
    const { MaChucVu, TenChucVu } = req.body;

    // Validate input
    if (!MaChucVu || !TenChucVu) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã và tên chức vụ'
      });
    }

    // Check if position code already exists
    const existingPosition = await ChucVu.findOne({ MaChucVu });
    if (existingPosition) {
      return res.status(409).json({
        success: false,
        message: 'Mã chức vụ đã tồn tại'
      });
    }

    const position = new ChucVu({
      MaChucVu,
      TenChucVu
    });

    await position.save();
    res.status(201).json({
      success: true,
      message: 'Tạo chức vụ thành công',
      data: position
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo chức vụ',
      error: error.message
    });
  }
};

// Update position
exports.updatePosition = async (req, res) => {
  try {
    const { MaChucVu, TenChucVu } = req.body;

    // Validate input
    if (!TenChucVu) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên chức vụ'
      });
    }

    const position = await ChucVu.findByIdAndUpdate(
      req.params.id,
      { TenChucVu },
      { new: true, runValidators: true }
    );

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Chức vụ không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật chức vụ thành công',
      data: position
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật chức vụ',
      error: error.message
    });
  }
};

// Delete position
exports.deletePosition = async (req, res) => {
  try {
    const position = await ChucVu.findByIdAndDelete(req.params.id);

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Chức vụ không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa chức vụ thành công',
      data: position
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa chức vụ',
      error: error.message
    });
  }
};
