const TaiKhoan = require('../models/TaiKhoan');
const bcrypt = require('bcryptjs');

// Get all accounts
exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await TaiKhoan.find().select('-MatKhau');
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách tài khoản thành công',
      data: accounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tài khoản',
      error: error.message
    });
  }
};

// Get account by ID
exports.getAccountById = async (req, res) => {
  try {
    const account = await TaiKhoan.findById(req.params.id).select('-MatKhau');
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Tài khoản không tồn tại'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Lấy thông tin tài khoản thành công',
      data: account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin tài khoản',
      error: error.message
    });
  }
};

// Create new account
exports.createAccount = async (req, res) => {
  try {
    const { TenDangNhap, MatKhau, VaiTro } = req.body;

    // Validate input
    if (!TenDangNhap || !MatKhau || !VaiTro) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên đăng nhập, mật khẩu và vai trò'
      });
    }

    if (MatKhau.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Check if username already exists
    const existingAccount = await TaiKhoan.findOne({ TenDangNhap });
    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message: 'Tên đăng nhập đã tồn tại'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(MatKhau, 10);

    const account = new TaiKhoan({
      TenDangNhap,
      MatKhau: hashedPassword,
      VaiTro
    });

    await account.save();

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: { ...account._doc, MatKhau: undefined }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo tài khoản',
      error: error.message
    });
  }
};

// Update account
exports.updateAccount = async (req, res) => {
  try {
    const { VaiTro } = req.body;

    const updateData = {};
    if (VaiTro) updateData.VaiTro = VaiTro;

    const account = await TaiKhoan.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-MatKhau');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Tài khoản không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật tài khoản thành công',
      data: account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật tài khoản',
      error: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { MatKhauCu, MatKhauMoi } = req.body;

    if (!MatKhauCu || !MatKhauMoi) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mật khẩu cũ và mới'
      });
    }

    if (MatKhauMoi.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    const account = await TaiKhoan.findById(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Tài khoản không tồn tại'
      });
    }

    // Check if old password is correct
    const isPasswordCorrect = await bcrypt.compare(MatKhauCu, account.MatKhau);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu cũ không chính xác'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(MatKhauMoi, 10);
    account.MatKhau = hashedPassword;
    await account.save();

    res.status(200).json({
      success: true,
      message: 'Thay đổi mật khẩu thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi mật khẩu',
      error: error.message
    });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const account = await TaiKhoan.findByIdAndDelete(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Tài khoản không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa tài khoản thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa tài khoản',
      error: error.message
    });
  }
};
