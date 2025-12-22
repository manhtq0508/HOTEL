const KhachHang = require('../models/KhachHang');

exports.create = async (req, res, next) => {
  try {
    const { MaKH, HoTen, CMND, SDT, Email } = req.body;
    
    if (!MaKH || !HoTen || !CMND || !SDT || !Email) {
      return res.status(400).json({ message: 'All customer fields are required' });
    }

    const khachHang = await KhachHang.create({
      MaKH,
      HoTen,
      CMND,
      SDT,
      Email,
      TaiKhoan: req.body.TaiKhoan || null
    });

    res.json(khachHang);
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const list = await KhachHang.find().populate('TaiKhoan').limit(200);
    res.json(list);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const khachHang = await KhachHang.findById(req.params.id).populate('TaiKhoan');
    if (!khachHang) return res.status(404).json({ message: 'Customer not found' });
    res.json(khachHang);
  } catch (err) { next(err); }
};

exports.getByMaKH = async (req, res, next) => {
  try {
    const khachHang = await KhachHang.findOne({ MaKH: req.params.MaKH }).populate('TaiKhoan');
    if (!khachHang) return res.status(404).json({ message: 'Customer not found' });
    res.json(khachHang);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const khachHang = await KhachHang.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('TaiKhoan');
    if (!khachHang) return res.status(404).json({ message: 'Customer not found' });
    res.json(khachHang);
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const khachHang = await KhachHang.findByIdAndDelete(req.params.id);
    if (!khachHang) return res.status(404).json({ message: 'Customer not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
