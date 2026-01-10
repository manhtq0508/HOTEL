const DatPhong = require('../models/DatPhong');
const Phong = require('../models/Phong');
const LoaiPhong = require('../models/LoaiPhong');

function isOverlap(aStart, aEnd, bStart, bEnd) {
  return (aStart < bEnd) && (bStart < aEnd);
}

// Helper to find available room for category and dates
const findAvailableRoom = async (hangPhong, startDate, endDate) => {
  try {
    const loaiPhong = await LoaiPhong.findOne({ TenLoaiPhong: hangPhong });
    if (!loaiPhong) return null;

    const rooms = await Phong.find({ LoaiPhong: loaiPhong._id });
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (const room of rooms) {
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

exports.create = async (req, res, next) => {
  try {
    const { MaDatPhong, KhachHang, HangPhong, NgayDen, NgayDi, SoKhach, TienCoc } = req.body;
    
    if (!MaDatPhong || !KhachHang || !HangPhong || !NgayDen || !NgayDi || !SoKhach) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const start = new Date(NgayDen);
    const end = new Date(NgayDi);
    if (start >= end) return res.status(400).json({ message: 'Invalid dates' });

    // Check for overlapping bookings
    const existing = await DatPhong.find({ TrangThai: { $ne: 'Cancelled' } });
    for (const e of existing) {
      if (isOverlap(start, end, new Date(e.NgayDen), new Date(e.NgayDi))) {
        return res.status(409).json({ message: 'Booking already exists for given dates' });
      }
    }

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
    if ((updateData.HangPhong || updateData.NgayDen || updateData.NgayDi || updateData.TrangThai === 'CheckedIn') && 
        (!updateData.ChiTietDatPhong || updateData.ChiTietDatPhong.length === 0)) {
      
      const current = await DatPhong.findById(req.params.id);
      if (current) {
        const hp = updateData.HangPhong || current.HangPhong;
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
