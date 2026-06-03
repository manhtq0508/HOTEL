const DatPhong = require('../models/DatPhong');
const LoaiPhong = require('../models/LoaiPhong');
const KhachHang = require('../models/KhachHang');
const bookingService = require('../services/bookingService');
const eventBus = require('../events/eventBus');
const roomService = require('../services/roomService');


// Helper findAvailableRoom moved to service


exports.create = async (req, res, next) => {
  try {
    const result = await bookingService.createBooking(req.body);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

exports.createWalkIn = async (req, res, next) => {
  try {
    const result = await bookingService.createWalkIn(req.body);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
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
          const room = await bookingService.findAvailableRoom(hp, start, end, current._id); // We need to handle excludeId
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
                $or: [{ NgayDen: { $lt: end }, NgayDi: { $gt: start } }]
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
    if (TrangThai) {
      const roomIds = datPhong.ChiTietDatPhong.map(d => d.Phong._id || d.Phong);
      if (TrangThai === 'CheckedIn') {
        eventBus.emit(eventBus.EVENTS.BOOKING_CHECKED_IN, { roomIds });
      } else if (TrangThai === 'CheckedOut') {
        eventBus.emit(eventBus.EVENTS.BOOKING_CHECKED_OUT, { roomIds });
      } else if (TrangThai === 'Cancelled') {
        eventBus.emit(eventBus.EVENTS.BOOKING_CANCELLED, { roomIds });
      }
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
      eventBus.emit(eventBus.EVENTS.BOOKING_CANCELLED, { roomIds });
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
