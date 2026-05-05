const DatPhong = require("../models/DatPhong");
const KhachHang = require("../models/KhachHang");
const Phong = require("../models/Phong");
const LoaiPhong = require("../models/LoaiPhong");

// Helper to find available room for category and dates
const findAvailableRoom = async (hangPhong, startDate, endDate) => {
  try {
    const loaiPhong = await LoaiPhong.findOne({ TenLoaiPhong: hangPhong });
    if (!loaiPhong) return null;

    const rooms = await Phong.find({ LoaiPhong: loaiPhong._id });
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    const now = new Date();
    for (const room of rooms) {
      // 1. Check strict Room Status
      // If room is in Maintenance, it's unavailable regardless of dates (usually)
      // Or at least if the booking overlaps with "now", or just generally we don't want to book maintenance rooms.
      // Assuming Maintenance is a blocking state.
      if (room.TrangThai === 'Maintenance') continue;

      // If booking starts now/today, respect strict room status
      if (start <= now && ['Occupied', 'Cleaning'].includes(room.TrangThai)) {
          continue;
      }
      
      // 2. Check overlap with existing Bookings
      // Check if this room has any overlapping bookings
      const overlapping = await DatPhong.findOne({
        "ChiTietDatPhong.Phong": room._id,
        TrangThai: { $nin: ["Cancelled", "CheckedOut", "NoShow", "Pending"] },
        $or: [
          { NgayDen: { $lt: end }, NgayDi: { $gt: start } }
        ]
      });
      
      if (!overlapping) return room;
    }
  } catch (error) {
    console.error("Error finding available room:", error);
  }
  return null;
};

// Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await DatPhong.find()
      .populate("KhachHang", "HoTen SoDT Email")
      .populate("ChiTietDatPhong.Phong");
    res.status(200).json({
      success: true,
      message: "Lấy danh sách đặt phòng thành công",
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách đặt phòng",
      error: error.message,
    });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await DatPhong.findById(req.params.id)
      .populate("KhachHang", "HoTen SoDT Email")
      .populate("ChiTietDatPhong.Phong");
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Đặt phòng không tồn tại",
      });
    }
    res.status(200).json({
      success: true,
      message: "Lấy thông tin đặt phòng thành công",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin đặt phòng",
      error: error.message,
    });
  }
};

// Get bookings by customer ID
exports.getBookingsByCustomerId = async (req, res) => {
  try {
    const bookings = await DatPhong.find({ KhachHang: req.params.customerId })
      .populate("KhachHang", "HoTen SoDT Email")
      .populate("ChiTietDatPhong.Phong")
      .sort({ NgayDat: -1 });
    res.status(200).json({
      success: true,
      message: "Lấy danh sách đặt phòng của khách hàng thành công",
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách đặt phòng",
      error: error.message,
    });
  }
};

// Create new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      HangPhong,
      NgayDen,
      NgayDi,
      SoKhach,
      TienCoc,
      ChiTietDatPhong,
    } = req.body;

    let customerId = req.body.KhachHang;

    // Use token to identify customer if role is 'Customer'
    if (req.user && req.user.VaiTro === 'Customer') {
      const kh = await KhachHang.findOne({ TaiKhoan: req.user.id });
      if (!kh) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin khách hàng cho tài khoản này",
        });
      }
      customerId = kh._id;
    }

    if (!customerId || !HangPhong || !NgayDen || !NgayDi || !SoKhach) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đủ thông tin đặt phòng",
      });
    }

    const count = await DatPhong.countDocuments();
    const MaDatPhong = `DP${String(count + 1).padStart(3, "0")}`;

    let finalDetails = ChiTietDatPhong || [];
    
    // Auto-assign room if not provided
    if (finalDetails.length === 0) {
      const room = await findAvailableRoom(HangPhong, NgayDen, NgayDi);
      if (room) {
        finalDetails = [{
          MaCTDP: `CTDP${Date.now()}`,
          Phong: room._id
        }];
      } else {
        return res.status(400).json({
          success: false,
          message: `Không còn phòng trống cho hạng ${HangPhong} trong khoảng thời gian này`
        });
      }
    }

    const booking = new DatPhong({
      MaDatPhong,
      KhachHang: customerId,
      HangPhong,
      NgayDen,
      NgayDi,
      SoKhach,
      TienCoc: TienCoc || 0,
      ChiTietDatPhong: finalDetails,
      TrangThai: "Pending",
    });

    await booking.save();
    await booking.populate("KhachHang", "HoTen SoDT Email");
    await booking.populate("ChiTietDatPhong.Phong");

    res.status(201).json({
      success: true,
      message: "Tạo đặt phòng thành công",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo đặt phòng",
      error: error.message,
    });
  }
};

// Update booking
exports.updateBooking = async (req, res) => {
  try {
    const { NgayDen, NgayDi, SoKhach, TienCoc, TrangThai, ChiTietDatPhong } =
      req.body;

    const updateData = {};
    if (NgayDen) updateData.NgayDen = NgayDen;
    if (NgayDi) updateData.NgayDi = NgayDi;
    if (SoKhach) updateData.SoKhach = SoKhach;
    if (TienCoc !== undefined) updateData.TienCoc = TienCoc;
    if (TrangThai) updateData.TrangThai = TrangThai;
    if (ChiTietDatPhong) updateData.ChiTietDatPhong = ChiTietDatPhong;

    // Auto-assign room if CheckedIn and room missing
    if ((TrangThai === "CheckedIn" || NgayDen || NgayDi) && 
        (!updateData.ChiTietDatPhong || updateData.ChiTietDatPhong.length === 0)) {
      
      const current = await DatPhong.findById(req.params.id);
      if (current) {
        const hp = current.HangPhong;
        const start = updateData.NgayDen ? new Date(updateData.NgayDen) : current.NgayDen;
        const end = updateData.NgayDi ? new Date(updateData.NgayDi) : current.NgayDi;
        
        const room = await findAvailableRoom(hp, start, end);
        if (room) {
          updateData.ChiTietDatPhong = [{
            MaCTDP: `CTDP${Date.now()}`,
            Phong: room._id
          }];
        }
      }
    }

    const booking = await DatPhong.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("KhachHang", "HoTen SoDT Email")
      .populate("ChiTietDatPhong.Phong");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Đặt phòng không tồn tại",
      });
    }

    // Update room status based on booking status
    if (TrangThai === "CheckedIn") {
      const roomIds = booking.ChiTietDatPhong.map(detail => detail.Phong._id || detail.Phong);
      await Phong.updateMany({ _id: { $in: roomIds } }, { TrangThai: "Occupied" });
    } else if (TrangThai === "CheckedOut" || TrangThai === "Cancelled") {
      const roomIds = booking.ChiTietDatPhong.map(detail => detail.Phong._id || detail.Phong);
      await Phong.updateMany({ _id: { $in: roomIds } }, { TrangThai: "Available" });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật đặt phòng thành công",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật đặt phòng",
      error: error.message,
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await DatPhong.findByIdAndUpdate(
      req.params.id,
      { TrangThai: "Cancelled" },
      { new: true }
    )
      .populate("KhachHang", "HoTen SoDT Email")
      .populate("ChiTietDatPhong.Phong");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Đặt phòng không tồn tại",
      });
    }

    // Update room status to Available
    if (booking.ChiTietDatPhong && booking.ChiTietDatPhong.length > 0) {
      const roomIds = booking.ChiTietDatPhong.map(detail => detail.Phong._id || detail.Phong);
      await Phong.updateMany({ _id: { $in: roomIds } }, { TrangThai: "Available" });
    }

    res.status(200).json({
      success: true,
      message: "Hủy đặt phòng thành công",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi hủy đặt phòng",
      error: error.message,
    });
  }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await DatPhong.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Đặt phòng không tồn tại",
      });
    }

    res.status(200).json({
      success: true,
      message: "Xóa đặt phòng thành công",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa đặt phòng",
      error: error.message,
    });
  }
};
