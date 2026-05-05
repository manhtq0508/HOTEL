const PhieuThuePhong = require('../models/PhieuThuePhong');
const Phong = require('../models/Phong');

// Get all rental receipts
exports.getAllRentalReceipts = async (req, res) => {
  try {
    const receipts = await PhieuThuePhong.find()
      .populate('DatPhong')
      .populate('Phong')
      .populate('NhanVienCheckIn', 'HoTen');
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách phiếu thuê phòng thành công',
      data: receipts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phiếu thuê phòng',
      error: error.message
    });
  }
};

// Get rental receipt by ID
exports.getRentalReceiptById = async (req, res) => {
  try {
    const receipt = await PhieuThuePhong.findById(req.params.id)
      .populate('DatPhong')
      .populate('Phong')
      .populate('NhanVienCheckIn', 'HoTen');
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Phiếu thuê phòng không tồn tại'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Lấy thông tin phiếu thuê phòng thành công',
      data: receipt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin phiếu thuê phòng',
      error: error.message
    });
  }
};

// Create new rental receipt
exports.createRentalReceipt = async (req, res) => {
  try {
    let { MaPTP, DatPhong, Phong: roomId, NgayTraDuKien, SoKhachThucTe, DonGiaSauDieuChinh, NhanVienCheckIn } = req.body;

    // Auto-generate MaPTP (PTPXXX format)
    if (!MaPTP || MaPTP.startsWith("PTP17")) {
      const count = await PhieuThuePhong.countDocuments();
      MaPTP = `PTP${String(count + 1).padStart(3, "0")}`;
    }

    // Validate input
    if (!DatPhong || !roomId || !NgayTraDuKien || !SoKhachThucTe || !DonGiaSauDieuChinh || !NhanVienCheckIn) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đủ thông tin phiếu thuê phòng'
      });
    }

    // Check if receipt code already exists
    const existingReceipt = await PhieuThuePhong.findOne({ MaPTP });
    if (existingReceipt) {
      return res.status(409).json({
        success: false,
        message: 'Mã phiếu thuê phòng đã tồn tại'
      });
    }

    const receipt = new PhieuThuePhong({
      MaPTP,
      DatPhong,
      Phong: roomId,
      NgayTraDuKien,
      SoKhachThucTe,
      DonGiaSauDieuChinh,
      NhanVienCheckIn,
      TrangThai: 'CheckedIn'
    });

    await receipt.save();
    
    // Update room status to Occupied
    await Phong.findByIdAndUpdate(receipt.Phong, { TrangThai: 'Occupied' });

    await receipt.populate('DatPhong');
    await receipt.populate('Phong');
    await receipt.populate('NhanVienCheckIn', 'HoTen');

    res.status(201).json({
      success: true,
      message: 'Tạo phiếu thuê phòng thành công',
      data: receipt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo phiếu thuê phòng',
      error: error.message
    });
  }
};

// Update rental receipt
exports.updateRentalReceipt = async (req, res) => {
  try {
    const { NgayTraDuKien, SoKhachThucTe, DonGiaSauDieuChinh, TrangThai } = req.body;

    const updateData = {};
    if (NgayTraDuKien) updateData.NgayTraDuKien = NgayTraDuKien;
    if (SoKhachThucTe) updateData.SoKhachThucTe = SoKhachThucTe;
    if (DonGiaSauDieuChinh) updateData.DonGiaSauDieuChinh = DonGiaSauDieuChinh;
    if (TrangThai) updateData.TrangThai = TrangThai;

    const receipt = await PhieuThuePhong.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('DatPhong')
     .populate('Phong')
     .populate('NhanVienCheckIn', 'HoTen');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Phiếu thuê phòng không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật phiếu thuê phòng thành công',
      data: receipt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật phiếu thuê phòng',
      error: error.message
    });
  }
};

// Check out
exports.checkOut = async (req, res) => {
  try {
    const receipt = await PhieuThuePhong.findByIdAndUpdate(
      req.params.id,
      { TrangThai: 'CheckedOut' },
      { new: true }
    ).populate('DatPhong')
     .populate('Phong')
     .populate('NhanVienCheckIn', 'HoTen');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Phiếu thuê phòng không tồn tại'
      });
    }

    // Update room status to Available
    await Phong.findByIdAndUpdate(receipt.Phong._id, { TrangThai: 'Available' });

    res.status(200).json({
      success: true,
      message: 'Check out thành công',
      data: receipt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi check out',
      error: error.message
    });
  }
};

// Delete rental receipt
exports.deleteRentalReceipt = async (req, res) => {
  try {
    const receipt = await PhieuThuePhong.findByIdAndDelete(req.params.id);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Phiếu thuê phòng không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa phiếu thuê phòng thành công',
      data: receipt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phiếu thuê phòng',
      error: error.message
    });
  }
};
