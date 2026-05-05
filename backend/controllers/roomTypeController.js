const LoaiPhong = require('../models/LoaiPhong');

// Get all room types
exports.getAllRoomTypes = async (req, res) => {
  try {
    const types = await LoaiPhong.find();
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách loại phòng thành công',
      data: types
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách loại phòng',
      error: error.message
    });
  }
};

// Get room type by ID
exports.getRoomTypeById = async (req, res) => {
  try {
    const type = await LoaiPhong.findById(req.params.id);
    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Loại phòng không tồn tại'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Lấy thông tin loại phòng thành công',
      data: type
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin loại phòng',
      error: error.message
    });
  }
};

// Create new room type
exports.createRoomType = async (req, res) => {
  try {
    const { MaLoaiPhong, TenLoaiPhong } = req.body;

    // Validate input
    if (!MaLoaiPhong || !TenLoaiPhong) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã và tên loại phòng'
      });
    }

    // Check if room type code already exists
    const existingType = await LoaiPhong.findOne({ MaLoaiPhong });
    if (existingType) {
      return res.status(409).json({
        success: false,
        message: 'Mã loại phòng đã tồn tại'
      });
    }

    const type = new LoaiPhong({
      MaLoaiPhong,
      TenLoaiPhong
    });

    await type.save();
    res.status(201).json({
      success: true,
      message: 'Tạo loại phòng thành công',
      data: type
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo loại phòng',
      error: error.message
    });
  }
};

// Update room type
exports.updateRoomType = async (req, res) => {
  try {
    const { TenLoaiPhong } = req.body;

    if (!TenLoaiPhong) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên loại phòng'
      });
    }

    const type = await LoaiPhong.findByIdAndUpdate(
      req.params.id,
      { TenLoaiPhong },
      { new: true, runValidators: true }
    );

    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Loại phòng không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật loại phòng thành công',
      data: type
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật loại phòng',
      error: error.message
    });
  }
};

// Delete room type
exports.deleteRoomType = async (req, res) => {
  try {
    const type = await LoaiPhong.findByIdAndDelete(req.params.id);

    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Loại phòng không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa loại phòng thành công',
      data: type
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa loại phòng',
      error: error.message
    });
  }
};
