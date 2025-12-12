const express = require('express');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

const router = express.Router();

// helper: check overlap
function isOverlap(aStart, aEnd, bStart, bEnd) {
  return (aStart < bEnd) && (bStart < aEnd);
}

// create booking
router.post('/', async (req, res, next) => {
  try {
    const { MaDatPhong, MaKH, MaPhong, NgayDen, NgayDi, TienCoc } = req.body;
    const start = new Date(NgayDen);
    const end = new Date(NgayDi);
    if (start >= end) return res.status(400).json({ message: 'Invalid dates' });

    // check existing bookings for this room that are not cancelled
    const existing = await Booking.find({ MaPhong, TrangThai: { $ne: 'Cancelled' } });
    for (const e of existing) {
      if (isOverlap(start, end, new Date(e.NgayDen), new Date(e.NgayDi))) {
        return res.status(409).json({ message: 'Room already booked for given dates' });
      }
    }

    const b = await Booking.create({ MaDatPhong, MaKH, MaPhong, NgayDen: start, NgayDi: end, TienCoc });
    await Room.findByIdAndUpdate(MaPhong, { TinhTrang: 'Booked' });
    res.json(b);
  } catch (err) { next(err); }
});

// checkin
router.post('/:id/checkin', async (req, res, next) => {
  try {
    const b = await Booking.findById(req.params.id);
    if (!b) return res.status(404).json({ message: 'Booking not found' });
    if (b.TrangThai !== 'Booked') return res.status(400).json({ message: 'Booking not in Booked state' });
    b.TrangThai = 'CheckedIn';
    await b.save();
    await Room.findByIdAndUpdate(b.MaPhong, { TinhTrang: 'Occupied' });
    res.json(b);
  } catch (err) { next(err); }
});

// checkout
router.post('/:id/checkout', async (req, res, next) => {
  try {
    const b = await Booking.findById(req.params.id);
    if (!b) return res.status(404).json({ message: 'Booking not found' });
    if (b.TrangThai !== 'CheckedIn') return res.status(400).json({ message: 'Booking not in CheckedIn state' });
    b.TrangThai = 'CheckedOut';
    await b.save();
    await Room.findByIdAndUpdate(b.MaPhong, { TinhTrang: 'Available' });
    res.json(b);
  } catch (err) { next(err); }
});

// basic queries
router.get('/', async (req, res, next) => {
  try {
    const list = await Booking.find().populate('MaKH MaPhong').limit(200);
    res.json(list);
  } catch (err) { next(err); }
});

module.exports = router;
