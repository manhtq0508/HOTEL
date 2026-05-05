const PhuongThucThanhToan = require('../models/PhuongThucThanhToan');

// Get all payment methods
exports.getAllPaymentMethods = async (req, res) => {
  try {
    const methods = await PhuongThucThanhToan.find();
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách phương thức thanh toán thành công',
      data: methods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phương thức thanh toán',
      error: error.message
    });
  }
};

// Get payment method by ID
exports.getPaymentMethodById = async (req, res) => {
  try {
    const method = await PhuongThucThanhToan.findById(req.params.id);
    if (!method) {
      return res.status(404).json({
        success: false,
        message: 'Phương thức thanh toán không tồn tại'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Lấy thông tin phương thức thanh toán thành công',
      data: method
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin phương thức thanh toán',
      error: error.message
    });
  }
};

// Create new payment method
exports.createPaymentMethod = async (req, res) => {
  try {
    const { MaPTTT, TenPTTT } = req.body;

    // Validate input
    if (!MaPTTT || !TenPTTT) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã và tên phương thức thanh toán'
      });
    }

    // Check if method code already exists
    const existingMethod = await PhuongThucThanhToan.findOne({ MaPTTT });
    if (existingMethod) {
      return res.status(409).json({
        success: false,
        message: 'Mã phương thức thanh toán đã tồn tại'
      });
    }

    const method = new PhuongThucThanhToan({
      MaPTTT,
      TenPTTT
    });

    await method.save();
    res.status(201).json({
      success: true,
      message: 'Tạo phương thức thanh toán thành công',
      data: method
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo phương thức thanh toán',
      error: error.message
    });
  }
};

// Update payment method
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { TenPTTT } = req.body;

    if (!TenPTTT) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên phương thức thanh toán'
      });
    }

    const method = await PhuongThucThanhToan.findByIdAndUpdate(
      req.params.id,
      { TenPTTT },
      { new: true, runValidators: true }
    );

    if (!method) {
      return res.status(404).json({
        success: false,
        message: 'Phương thức thanh toán không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật phương thức thanh toán thành công',
      data: method
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật phương thức thanh toán',
      error: error.message
    });
  }
};

// Delete payment method
exports.deletePaymentMethod = async (req, res) => {
  try {
    const method = await PhuongThucThanhToan.findByIdAndDelete(req.params.id);

    if (!method) {
      return res.status(404).json({
        success: false,
        message: 'Phương thức thanh toán không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa phương thức thanh toán thành công',
      data: method
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phương thức thanh toán',
      error: error.message
    });
  }
};
