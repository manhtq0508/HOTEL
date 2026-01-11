const DatPhong = require('../models/DatPhong');
const Phong = require('../models/Phong');
const LoaiPhong = require('../models/LoaiPhong');
const KhachHang = require('../models/KhachHang');

function isOverlap(aStart, aEnd, bStart, bEnd) {
  return (aStart < bEnd) && (bStart < aEnd);
}

// Helper to find available room for category and dates
const findAvailableRoom = async (hangPhong, startDate, endDate, excludeBookingId = null) => {
  try {
    const loaiPhong = await LoaiPhong.findOne({ TenLoaiPhong: hangPhong });
    if (!loaiPhong) return null;

    const rooms = await Phong.find({ LoaiPhong: loaiPhong._id });
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (const room of rooms) {
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
  }
  return null;
};

exports.create = async (req, res, next) => {
  try {
    let { MaDatPhong, KhachHang, HangPhong, NgayDen, NgayDi, SoKhach, TienCoc } = req.body;
    
    if (!KhachHang || !HangPhong || !NgayDen || !NgayDi || !SoKhach) {
      return res.status(400).json({ message: 'Missing required fields' });
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
    if (start >= end) return res.status(400).json({ message: 'Invalid dates' });

    // Check for overlapping bookings
    // Check for overlapping bookings - REMOVED incorrect global check
    // The system should check for room availability instead (handled below by findAvailableRoom)
    /* 
    const existing = await DatPhong.find({ TrangThai: { $ne: 'Cancelled' } });
    for (const e of existing) {
      if (isOverlap(start, end, new Date(e.NgayDen), new Date(e.NgayDi))) {
        return res.status(409).json({ message: 'Booking already exists for given dates' });
      }
    }
    */

    let ChiTietDatPhong = req.body.ChiTietDatPhong || [];

    // Auto-assign room if not provided
    if (ChiTietDatPhong.length === 0) {
      const room = await findAvailableRoom(HangPhong, start, end);
      if (room) {
        ChiTietDatPhong = [{
          MaCTDP: `CTDP${Date.now()}`,
          Phong: room._id
        }];
      } else {
        return res.status(400).json({ 
          message: `Không còn phòng trống cho hạng ${HangPhong} trong khoảng thời gian này` 
        });
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

    res.json(datPhong);
  } catch (err) { next(err); }
};

exports.createWalkIn = async (req, res, next) => {
  try {
    const { 
      // Booking info
      MaDatPhong, HangPhong, NgayDen, NgayDi, SoKhach, TienCoc, ChiTietDatPhong,
      // Guest info
      HoTen, CMND, SDT, Email
    } = req.body;

    if (!HoTen || !CMND || !SDT || !HangPhong || !NgayDen || !NgayDi || !SoKhach) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 1. Find or Create Customer
    let customer = await KhachHang.findOne({ 
        $or: [{ CMND: CMND }, { Email: Email }] 
    });

    if (!customer) {
        // Generate MaKH if not provided (simple logic or use a counter in real app)
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const MaKH = `KH${randomSuffix}`;
        
        customer = await KhachHang.create({
            MaKH,
            HoTen,
            CMND,
            SDT,
            Email,
            TaiKhoan: null // Walk-in guest has no account
        });
    }

    // 2. Create Booking
    const start = new Date(NgayDen);
    const end = new Date(NgayDi);
    if (start >= end) return res.status(400).json({ message: 'Invalid dates' });

    // Check availability
    // Check availability - REMOVED incorrect global check
    // Rely on room availability check below
    // Check availability: Existing logic assumes we check available rooms later using findAvailableRoom

    let finalChiTiet = ChiTietDatPhong || [];
    if (finalChiTiet.length === 0) {
        const room = await findAvailableRoom(HangPhong, start, end);
        if (!room) {
            return res.status(400).json({ message: `Không còn phòng trống cho hạng ${HangPhong}` });
        }
        finalChiTiet = [{
            MaCTDP: `CTDP${Date.now()}`,
            Phong: room._id
        }];
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

    res.json(datPhong);
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const list = await DatPhong.find()
      .populate('KhachHang')
      .populate('ChiTietDatPhong.Phong')
      .limit(200);
    res.json(list);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const datPhong = await DatPhong.findById(req.params.id)
      .populate('KhachHang')
      .populate('ChiTietDatPhong.Phong');
    if (!datPhong) return res.status(404).json({ message: 'Booking not found' });
    res.json(datPhong);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    
    // If HangPhong, dates changed, or checking in, and no room assigned, try to auto-assign
    // If status is changing to 'Confirmed' or 'CheckedIn', OR if details changed, we must validate/assign room
    if ((updateData.HangPhong || updateData.NgayDen || updateData.NgayDi || 
        ['Confirmed', 'CheckedIn'].includes(updateData.TrangThai))) {
      
       const current = await DatPhong.findById(req.params.id);
       if (current) {
         // Get effective data
         const hp = updateData.HangPhong || current.HangPhong;
         const start = updateData.NgayDen ? new Date(updateData.NgayDen) : current.NgayDen;
         const end = updateData.NgayDi ? new Date(updateData.NgayDi) : current.NgayDi;

         // Check if we need to assign a room OR validate existing assignment
         // If no room assigned, or if we are confirming/checking in, let's be safe and check availability
         // Note: If room is ALREADY assigned, findAvailableRoom might fail because it sees ITSELF as overlap?
         // findAvailableRoom checks *other* bookings. But we passed start/end.
         // Wait, findAvailableRoom checks `DatPhong` collection.
         // If "current" booking is in DB (it is), and it has status 'Pending' (it does), 
         // and we now include 'Pending' in check...
         // Then findAvailableRoom will find 'current' booking as overlapping itself!
         // FIX: findAvailableRoom needs to exclude the current booking ID.
         // We should update findAvailableRoom signature or logic.
         // Ideally, `findAvailableRoom` checks *rooms*.
         
         // Let's assume for now we only auto-assign if missing. 
         // If confirming, we must ensure the *assigned* room is not Double Booked.
         
         if (!updateData.ChiTietDatPhong && (!current.ChiTietDatPhong || current.ChiTietDatPhong.length === 0)) {
             // Case 1: No room assigned yet. Find one.
             const room = await findAvailableRoom(hp, start, end, current._id); // We need to handle excludeId
             if (room) {
                updateData.ChiTietDatPhong = [{
                    MaCTDP: `CTDP${Date.now()}`,
                    Phong: room._id
                }];
             } else {
                 if (['Confirmed', 'CheckedIn'].includes(updateData.TrangThai)) {
                     return res.status(400).json({ message: `Không còn phòng trống cho hạng ${hp}.` });
                 }
             }
         } else {
             // Case 2: Room already assigned. Verify it's still available if we are Checking In?
             // Since we essentially "Reserved" it at creation (by including Pending in blocked list), we *should* be safe.
             // The only risk is if we created double Pending bookings *before* this fix.
             // To be robust: Check if the assigned room overlaps with any *other* NON-CANCELLED booking.
             // We can skip this complex check if we rely on the creation fix. 
             // BUT user asked to fix existing issue.
             // Let's trust that including 'Pending' in findAvailableRoom fixes the root cause.
             // If we really want to block updates for bad data:
             if (['Confirmed', 'CheckedIn'].includes(updateData.TrangThai)) {
                 // Ensure we don't have double booking for this room
                 const assignedRoomId = updateData.ChiTietDatPhong?.[0]?.Phong || current.ChiTietDatPhong?.[0]?.Phong;
                 if (assignedRoomId) {
                     const isDouble = await DatPhong.findOne({
                         _id: { $ne: current._id },
                         "ChiTietDatPhong.Phong": assignedRoomId,
                         TrangThai: { $nin: ['Cancelled', 'CheckedOut', 'NoShow'] }, // Any valid booking
                         $or: [ { NgayDen: { $lt: end }, NgayDi: { $gt: start } } ]
                     });
                     if (isDouble) {
                         return res.status(400).json({ message: `Phòng đã bị trùng lịch với booking ${isDouble.MaDatPhong}.` });
                     }
                 }
             }
         }
       }
    }

    const datPhong = await DatPhong.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('KhachHang')
      .populate('ChiTietDatPhong.Phong');
    if (!datPhong) return res.status(404).json({ message: 'Booking not found' });

    // Update room status based on booking status
    const TrangThai = updateData.TrangThai;
    if (TrangThai === "CheckedIn") {
      const roomIds = datPhong.ChiTietDatPhong.map(detail => detail.Phong._id || detail.Phong);
      await Phong.updateMany({ _id: { $in: roomIds } }, { TrangThai: "Occupied" });
    } else if (TrangThai === "CheckedOut" || TrangThai === "Cancelled") {
      const roomIds = datPhong.ChiTietDatPhong.map(detail => detail.Phong._id || detail.Phong);
      await Phong.updateMany({ _id: { $in: roomIds } }, { TrangThai: "Available" });
    }

    res.json(datPhong);
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const datPhong = await DatPhong.findByIdAndUpdate(
      req.params.id,
      { TrangThai: 'Cancelled' },
      { new: true }
    ).populate('KhachHang')
     .populate('ChiTietDatPhong.Phong');
    
    if (!datPhong) return res.status(404).json({ message: 'Booking not found' });

    // Update room status to Available
    if (datPhong.ChiTietDatPhong && datPhong.ChiTietDatPhong.length > 0) {
      const roomIds = datPhong.ChiTietDatPhong.map(detail => detail.Phong._id || detail.Phong);
      await Phong.updateMany({ _id: { $in: roomIds } }, { TrangThai: "Available" });
    }

    res.json(datPhong);
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const datPhong = await DatPhong.findByIdAndDelete(req.params.id);
    if (!datPhong) return res.status(404).json({ message: 'Booking not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
