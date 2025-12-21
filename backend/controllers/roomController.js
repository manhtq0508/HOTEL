const Phong = require('../models/Phong');
const LoaiPhong = require('../models/LoaiPhong');

exports.create = async (req, res, next) => {
  try {
    const { MaPhong, LoaiPhong, GiaPhong } = req.body;

    if (!MaPhong || !LoaiPhong || GiaPhong === undefined) {
      return res.status(400).json({ message: 'MaPhong, LoaiPhong, and GiaPhong are required' });
    }

    const phong = await Phong.create({
      MaPhong,
      LoaiPhong,
      GiaPhong,
      TrangThai: 'Available'
    });

    res.json(phong);
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const list = await Phong.find().populate('LoaiPhong');
    res.json(list);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const phong = await Phong.findById(req.params.id).populate('LoaiPhong');
    if (!phong) return res.status(404).json({ message: 'Room not found' });
    res.json(phong);
  } catch (err) { next(err); }
};

exports.getByMaPhong = async (req, res, next) => {
  try {
    const phong = await Phong.findOne({ MaPhong: req.params.MaPhong }).populate('LoaiPhong');
    if (!phong) return res.status(404).json({ message: 'Room not found' });
    res.json(phong);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const phong = await Phong.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('LoaiPhong');
    if (!phong) return res.status(404).json({ message: 'Room not found' });
    res.json(phong);
  } catch (err) { next(err); }
};

exports.changeStatus = async (req, res, next) => {
  try {
    const { TrangThai } = req.body;
    const validStatus = ['Available', 'Occupied', 'Maintenance', 'Reserved', 'NeedCleaning'];
    
    if (!validStatus.includes(TrangThai)) {
      return res.status(400).json({ message: `Invalid status. Valid statuses: ${validStatus.join(', ')}` });
    }

    const phong = await Phong.findByIdAndUpdate(
      req.params.id,
      { TrangThai },
      { new: true }
    ).populate('LoaiPhong');

    if (!phong) return res.status(404).json({ message: 'Room not found' });
    res.json(phong);
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const phong = await Phong.findByIdAndDelete(req.params.id);
    if (!phong) return res.status(404).json({ message: 'Room not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
