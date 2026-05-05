const DatPhong = require('../models/DatPhong');
const Phong = require('../models/Phong');
const LoaiPhong = require('../models/LoaiPhong');
const KhachHang = require('../models/KhachHang');
const notificationController = require('../controllers/notificationController');


exports.findAvailableRoom = async (hangPhong, startDate, endDate, excludeBookingId = null) => {
  try {
    const loaiPhong = await LoaiPhong.findOne({ TenLoaiPhong: hangPhong });
    if (!loaiPhong) return null;


    const rooms = await Phong.find({ LoaiPhong: loaiPhong._id });
   
    const start = new Date(startDate);
    const end = new Date(endDate);


    const now = new Date();
    for (const room of rooms) {
      if (room.TrangThai === 'Maintenance') continue;
      
      // If booking starts now/today, respect strict room status
      if (start <= now && ['Occupied', 'Cleaning'].includes(room.TrangThai)) {
          continue;
      }
      // Check if this room has any overlapping bookings
      const query = {
        "ChiTietDatPhong.Phong": room._id,
        TrangThai: { $nin: ["Cancelled", "CheckedOut", "NoShow"] },
        $or: [
            { NgayDen: { $lt: end }, NgayDi: { $gt: start } }
        ]
      };


      if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
      }


      const overlapping = await DatPhong.findOne(query);
     
      if (!overlapping) return room;
    }
  } catch (error) {
    console.error("Error finding available room:", error);
    throw error;
  }
  return null;
};


exports.createBooking = async (data) => {
    let { MaDatPhong, KhachHang, HangPhong, NgayDen, NgayDi, SoKhach, TienCoc, ChiTietDatPhong } = data;
   
    if (!KhachHang || !HangPhong || !NgayDen || !NgayDi || !SoKhach) {
      throw { status: 400, message: 'Missing required fields' };
    }


    // Auto-generate MaDatPhong if missing
    if (!MaDatPhong) {
        const lastBooking = await DatPhong.findOne().sort({ MaDatPhong: -1 });
        let nextId = 1;
        if (lastBooking && lastBooking.MaDatPhong) {
            const match = lastBooking.MaDatPhong.match(/DP(\d+)/);
            if (match) {
                nextId = parseInt(match[1], 10) + 1;
            }
        }
        MaDatPhong = `DP${String(nextId).padStart(3, '0')}`;
    }


    const start = new Date(NgayDen);
    const end = new Date(NgayDi);
    if (start >= end) throw { status: 400, message: 'Invalid dates' };


    ChiTietDatPhong = ChiTietDatPhong || [];


    // Auto-assign room if not provided
    if (ChiTietDatPhong.length === 0) {
      const room = await exports.findAvailableRoom(HangPhong, start, end);
      if (room) {
        ChiTietDatPhong = [{
          MaCTDP: `CTDP${Date.now()}`,
          Phong: room._id
        }];
      } else {
        throw {
          status: 400,
          message: `Không còn phòng trống cho hạng ${HangPhong} trong khoảng thời gian này`
        };
      }
    }


    const datPhong = await DatPhong.create({
      MaDatPhong,
      KhachHang,
      HangPhong,
      NgayDen: start,
      NgayDi: end,
      SoKhach,
      TienCoc: TienCoc || 0,
      ChiTietDatPhong,
      TrangThai: 'Pending'
    });


    // Create notification for guest
    await notificationController.createNotification(
      KhachHang,
      'Đặt phòng thành công',
      `Đơn đặt phòng ${MaDatPhong} của bạn đã được tạo. Vui lòng chờ xác nhận.`,
      'Booking'
    );


    return datPhong;
};


// Moving createWalkIn here as well for consistency, though primarily targeted at createBooking
exports.createWalkIn = async (data) => {
    const {
      // Booking info
      MaDatPhong: inputMaDP, HangPhong, NgayDen, NgayDi, SoKhach, TienCoc, ChiTietDatPhong,
      // Guest info
      HoTen, CMND, SDT, Email
    } = data;
   
    let MaDatPhong = inputMaDP;


    if (!HoTen || !CMND || !SDT || !HangPhong || !NgayDen || !NgayDi || !SoKhach) {
      throw { status: 400, message: 'Missing required fields' };
    }


    // 1. Find or Create Customer
    let customer = await KhachHang.findOne({
        $or: [{ CMND: CMND }, { Email: Email }]
    });


    if (!customer) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const MaKH = `KH${randomSuffix}`;
       
        customer = await KhachHang.create({
            MaKH,
            HoTen,
            CMND,
            SDT,
            Email,
            TaiKhoan: null
        });
    }


    // 2. Create Booking
    const start = new Date(NgayDen);
    const end = new Date(NgayDi);
    if (start >= end) throw { status: 400, message: 'Invalid dates' };


    let finalChiTiet = ChiTietDatPhong || [];
    if (finalChiTiet.length === 0) {
        const room = await exports.findAvailableRoom(HangPhong, start, end);
        if (!room) {
            throw { status: 400, message: `Không còn phòng trống cho hạng ${HangPhong}` };
        }
        finalChiTiet = [{
            MaCTDP: `CTDP${Date.now()}`,
            Phong: room._id
        }];
    }


    // Auto-generate MaDatPhong
    if (!MaDatPhong) {
        const lastBooking = await DatPhong.findOne().sort({ MaDatPhong: -1 });
        let nextId = 1;
        if (lastBooking && lastBooking.MaDatPhong) {
            const match = lastBooking.MaDatPhong.match(/DP(\d+)/);
            if (match) {
                nextId = parseInt(match[1], 10) + 1;
            }
        }
        MaDatPhong = `DP${String(nextId).padStart(3, '0')}`;
    }


    const datPhong = await DatPhong.create({
      MaDatPhong,
      KhachHang: customer._id,
      HangPhong,
      NgayDen: start,
      NgayDi: end,
      SoKhach,
      TienCoc: TienCoc || 0,
      ChiTietDatPhong: finalChiTiet,
      TrangThai: 'Pending'
    });


    return datPhong;
};



