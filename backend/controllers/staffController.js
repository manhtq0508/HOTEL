const NhanVien = require('../models/NhanVien');
const TaiKhoan = require('../models/TaiKhoan');

// Get all staff
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await NhanVien.find()
      .populate('TaiKhoan', 'TenDangNhap VaiTro')
      .populate('ChucVu', 'TenChucVu');
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách nhân viên thành công',
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách nhân viên',
      error: error.message
    });
  }
};

// Get staff by ID
exports.getStaffById = async (req, res) => {
  try {
    const staff = await NhanVien.findById(req.params.id)
      .populate('TaiKhoan', 'TenDangNhap VaiTro')
      .populate('ChucVu', 'TenChucVu');
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Nhân viên không tồn tại'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Lấy thông tin nhân viên thành công',
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin nhân viên',
      error: error.message
    });
  }
};

// Create new staff
exports.createStaff = async (req, res) => {
  try {
    const { MaNV, HoTen, ChucVu, SDT, TaiKhoan } = req.body;

    // Validate input
    if (!MaNV || !HoTen || !ChucVu || !SDT) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đủ thông tin nhân viên'
      });
    }

    // Check if MaNV already exists
    const existingStaff = await NhanVien.findOne({ MaNV });
    if (existingStaff) {
      return res.status(409).json({
        success: false,
        message: 'Mã nhân viên đã tồn tại'
      });
    }

    const staff = new NhanVien({
      MaNV,
      HoTen,
      ChucVu,
      SDT,
      TaiKhoan: TaiKhoan || null
    });

    await staff.save();
    await staff.populate('TaiKhoan', 'TenDangNhap VaiTro');
    await staff.populate('ChucVu', 'TenChucVu');

    res.status(201).json({
      success: true,
      message: 'Tạo nhân viên thành công',
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo nhân viên',
      error: error.message
    });
  }
};

// Update staff
exports.updateStaff = async (req, res) => {
  try {
    const { HoTen, ChucVu, SDT, TaiKhoan } = req.body;

    const updateData = {};
    if (HoTen) updateData.HoTen = HoTen;
    if (ChucVu) updateData.ChucVu = ChucVu;
    if (SDT) updateData.SDT = SDT;
    if (TaiKhoan !== undefined) updateData.TaiKhoan = TaiKhoan;

    const staff = await NhanVien.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('TaiKhoan', 'TenDangNhap VaiTro')
     .populate('ChucVu', 'TenChucVu');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Nhân viên không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật nhân viên thành công',
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật nhân viên',
      error: error.message
    });
  }
};

// Delete staff
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await NhanVien.findByIdAndDelete(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Nhân viên không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa nhân viên thành công',
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa nhân viên',
      error: error.message
    });
  }
};
