const KhachHang = require('../models/KhachHang');

exports.create = async (req, res, next) => {
  try {
    let { MaKH, HoTen, CMND, SDT, Email, DiaChi } = req.body;
    
    if (!HoTen || !CMND || !SDT || !Email) {
      return res.status(400).json({ message: 'All customer fields are required' });
    }

    // Auto-generate MaKH if missing
    if (!MaKH) {
        const lastCustomer = await KhachHang.findOne().sort({ MaKH: -1 });
        let nextId = 1;
        if (lastCustomer && lastCustomer.MaKH) {
            const match = lastCustomer.MaKH.match(/KH(\d+)/);
            if (match) {
                nextId = parseInt(match[1], 10) + 1;
            }
        }
        MaKH = `KH${String(nextId).padStart(3, '0')}`;
    }

    const khachHang = await KhachHang.create({
      MaKH,
      HoTen,
      CMND,
      SDT,
      Email,
      DiaChi,
      ...(req.body.TaiKhoan ? { TaiKhoan: req.body.TaiKhoan } : {})
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
