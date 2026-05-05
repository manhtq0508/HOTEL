const PhieuBaoTri = require("../models/PhieuBaoTri");
const DatPhong = require("../models/DatPhong");


// Get all maintenance records
exports.getAllMaintenanceRecords = async (req, res) => {
  try {
    const records = await PhieuBaoTri.find()
      .populate("Phong")
      .populate("NVKyThuat", "HoTen");
    res.status(200).json({
      success: true,
      message: "Lấy danh sách phiếu bảo trì thành công",
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách phiếu bảo trì",
      error: error.message,
    });
  }
};


// Get maintenance record by ID
exports.getMaintenanceRecordById = async (req, res) => {
  try {
    const record = await PhieuBaoTri.findById(req.params.id)
      .populate("Phong")
      .populate("NVKyThuat", "HoTen");
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Phiếu bảo trì không tồn tại",
      });
    }
    res.status(200).json({
      success: true,
      message: "Lấy thông tin phiếu bảo trì thành công",
      data: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin phiếu bảo trì",
      error: error.message,
    });
  }
};


// Create new maintenance record
exports.createMaintenanceRecord = async (req, res) => {
  try {
    const { MaPBT, Phong, NVKyThuat, NgayThucHien, NgayKetThuc, NoiDung } =
      req.body;


    // Validate input
    if (
      !MaPBT ||
      !Phong ||
      !NVKyThuat ||
      !NgayThucHien ||
      !NgayKetThuc ||
      !NoiDung
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đủ thông tin phiếu bảo trì",
      });
    }


    // Check if record code already exists
    const existingRecord = await PhieuBaoTri.findOne({ MaPBT });
    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: "Mã phiếu bảo trì đã tồn tại",
      });
    }

    // Check for active booking overlap
    // Find active booking for this room: CheckedIn
    const activeBooking = await DatPhong.findOne({
        "ChiTietDatPhong.Phong": Phong,
        TrangThai: "CheckedIn"
    });

    if (activeBooking) {
        const bookingEndDate = new Date(activeBooking.NgayDi);
        // Normalize to YYYY-MM-DD for comparison to ignore time
        const maintenanceStartDate = new Date(NgayThucHien);
        
        // Reset hours to compare dates only
        bookingEndDate.setHours(0,0,0,0);
        maintenanceStartDate.setHours(0,0,0,0);

        if (maintenanceStartDate < bookingEndDate) {
             return res.status(400).json({
                success: false,
                message: `Phòng đang có khách. Ngày bảo trì phải từ ngày ${activeBooking.NgayDi.toISOString().split('T')[0]} trở đi.`,
            });
        }
    }

    const record = new PhieuBaoTri({
      MaPBT,
      Phong,
      NVKyThuat,
      NgayThucHien,
      NgayKetThuc,
      NoiDung,
      TrangThai: "Pending",
    });


    await record.save();


    // Update Room status to 'Maintenance'
    const PhongModel = require("../models/Phong");
    await PhongModel.findByIdAndUpdate(Phong, { TrangThai: "Maintenance" });

    await record.populate("Phong");
    await record.populate("NVKyThuat", "HoTen");


    res.status(201).json({
      success: true,
      message: "Tạo phiếu bảo trì thành công",
      data: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo phiếu bảo trì",
      error: error.message,
    });
  }
};


// Update maintenance record
exports.updateMaintenanceRecord = async (req, res) => {
  try {
    const { NoiDung, NVKyThuat, NgayKetThuc, NgayThucHien, TrangThai } =
      req.body;


    const updateData = {};
    if (NoiDung) updateData.NoiDung = NoiDung;
    if (NVKyThuat) updateData.NVKyThuat = NVKyThuat;
    if (NgayThucHien) updateData.NgayThucHien = NgayThucHien;
    if (NgayKetThuc) updateData.NgayKetThuc = NgayKetThuc;
    if (TrangThai) updateData.TrangThai = TrangThai;


    const record = await PhieuBaoTri.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("Phong")
      .populate("NVKyThuat", "HoTen");


    // If status is Completed, free the room
    if (TrangThai === "Completed" && record && record.Phong) {
      const PhongModel = require("../models/Phong");
      await PhongModel.findByIdAndUpdate(record.Phong._id || record.Phong, {
        TrangThai: "Available",
      });
    }


    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Phiếu bảo trì không tồn tại",
      });
    }


    res.status(200).json({
      success: true,
      message: "Cập nhật phiếu bảo trì thành công",
      data: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật phiếu bảo trì",
      error: error.message,
    });
  }
};


// Delete maintenance record
exports.deleteMaintenanceRecord = async (req, res) => {
  try {
    const record = await PhieuBaoTri.findByIdAndDelete(req.params.id);


    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Phiếu bảo trì không tồn tại",
      });
    }


    res.status(200).json({
      success: true,
      message: "Xóa phiếu bảo trì thành công",
      data: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa phiếu bảo trì",
      error: error.message,
    });
  }
};


// Get next available MaPBT code
exports.getNextMaPBTCode = async (req, res) => {
  try {
    const lastRecord = await PhieuBaoTri.findOne().sort({ MaPBT: -1 });
    let nextId = 1;
    if (lastRecord && lastRecord.MaPBT) {
      const match = lastRecord.MaPBT.match(/PBT(\d+)/);
      if (match) {
        nextId = parseInt(match[1], 10) + 1;
      }
    }
    const nextCode = `PBT${String(nextId).padStart(3, "0")}`;
    res.status(200).json({
      success: true,
      nextCode,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy mã phiếu bảo trì tiếp theo",
      error: error.message,
    });
  }
};


// Get maintenance requests for a guest
exports.getMaintenanceRequestsForGuest = async (req, res) => {
  try {
    const guestId = req.user.id;
    const requests = await PhieuBaoTri.find({ KhachHang: guestId })
      .populate('Phong', 'SoPhong')
      .sort({ NgayThucHien: -1 });
    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy yêu cầu bảo trì',
      error: error.message
    });
  }
};


// Create maintenance request by guest
exports.createMaintenanceRequest = async (req, res) => {
  try {
    const { Phong, NoiDung } = req.body;
    const guestId = req.user.id;


    if (!Phong || !NoiDung) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp phòng và nội dung yêu cầu'
      });
    }


    // Get next MaPBT
    const lastRecord = await PhieuBaoTri.findOne().sort({ MaPBT: -1 });
    let nextId = 1;
    if (lastRecord && lastRecord.MaPBT) {
      const match = lastRecord.MaPBT.match(/PBT(\d+)/);
      if (match) {
        nextId = parseInt(match[1], 10) + 1;
      }
    }
    const MaPBT = `PBT${String(nextId).padStart(3, '0')}`;


    const request = new PhieuBaoTri({
      MaPBT,
      Phong,
      KhachHang: guestId,
      NoiDung,
      TrangThai: 'Pending'
    });


    await request.save();
    await request.populate('Phong', 'SoPhong');


    // Create notification for guest
    const notificationController = require('./notificationController');
    await notificationController.createNotification(
      guestId,
      'Yêu cầu bảo trì đã gửi',
      `Yêu cầu bảo trì ${MaPBT} đã được gửi. Chúng tôi sẽ xử lý sớm nhất.`,
      'Maintenance'
    );


    res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu bảo trì thành công',
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi yêu cầu bảo trì',
      error: error.message
    });
  }
};



