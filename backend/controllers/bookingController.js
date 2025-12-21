const DatPhong = require('../models/DatPhong');
const Phong = require('../models/Phong');

function isOverlap(aStart, aEnd, bStart, bEnd) {
  return (aStart < bEnd) && (bStart < aEnd);
}

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

    const datPhong = await DatPhong.create({
      MaDatPhong,
      KhachHang,
      HangPhong,
      NgayDen: start,
      NgayDi: end,
      SoKhach,
      TienCoc: TienCoc || 0,
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
    const datPhong = await DatPhong.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('KhachHang')
      .populate('ChiTietDatPhong.Phong');
    if (!datPhong) return res.status(404).json({ message: 'Booking not found' });
    res.json(datPhong);
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const datPhong = await DatPhong.findByIdAndUpdate(
      req.params.id,
      { TrangThai: 'Cancelled' },
      { new: true }
    ).populate('KhachHang');
    
    if (!datPhong) return res.status(404).json({ message: 'Booking not found' });
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
