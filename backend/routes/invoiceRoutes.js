const express = require('express');
const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Service = require('../models/Service');

const router = express.Router();

// create invoice (simple)
router.post('/', async (req, res, next) => {
  try {
    const { MaHD, MaDatPhong, Items } = req.body;
    let items = Items || [];
    let tong = 0;

    if ((!items || items.length === 0) && MaDatPhong) {
      // compute room charge
      const b = await Booking.findById(MaDatPhong).populate('MaPhong');
      if (!b) return res.status(400).json({ message: 'Booking not found' });
      const room = await Room.findById(b.MaPhong);
      const nights = Math.ceil((new Date(b.NgayDi) - new Date(b.NgayDen)) / (1000*60*60*24));
      const amount = (room.DonGia || 0) * Math.max(1, nights);
      items = [{ type: 'Room', refId: room._id, SoLuong: nights, ThanhTien: amount }];
      tong = amount;
    } else {
      // validate given items; if an item has no ThanhTien, try to fetch price
      for (const it of items) {
        if (!it.ThanhTien) {
          if (it.type === 'Service') {
            const s = await Service.findById(it.refId);
            it.ThanhTien = (s ? s.DonGia : 0) * (it.SoLuong || 1);
          } else if (it.type === 'Room') {
            const r = await Room.findById(it.refId);
            it.ThanhTien = (r ? r.DonGia : 0) * (it.SoLuong || 1);
          } else it.ThanhTien = 0;
        }
        tong += it.ThanhTien || 0;
      }
    }

    const inv = await Invoice.create({ MaHD, MaDatPhong, Items: items, TongTien: tong });
    res.json(inv);
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try { const list = await Invoice.find().limit(200); res.json(list); } catch (err) { next(err); }
});

module.exports = router;
