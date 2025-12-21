const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const TaiKhoan = require('../models/TaiKhoan');
const NhanVien = require('../models/NhanVien');
const KhachHang = require('../models/KhachHang');

exports.register = async (req, res, next) => {
  try {
    const { TenDangNhap, MatKhau, VaiTro, HoTen, CMND, SDT, Email } = req.body;
    
    if (!TenDangNhap || !MatKhau || !VaiTro) {
      return res.status(400).json({ message: 'TenDangNhap, MatKhau, and VaiTro are required' });
    }

    const existingAccount = await TaiKhoan.findOne({ TenDangNhap });
    if (existingAccount) {
      return res.status(409).json({ message: 'Account already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const matKhauHash = await bcrypt.hash(MatKhau, salt);

    const taiKhoan = await TaiKhoan.create({
      TenDangNhap,
      MatKhau: matKhauHash,
      VaiTro
    });

    // If Customer role, create KhachHang
    if (VaiTro === 'Customer' && HoTen && CMND && SDT && Email) {
      const makh = 'KH' + Date.now();
      await KhachHang.create({
        MaKH: makh,
        TaiKhoan: taiKhoan._id,
        HoTen,
        CMND,
        SDT,
        Email
      });
    }

    res.json({ id: taiKhoan._id, TenDangNhap: taiKhoan.TenDangNhap, VaiTro: taiKhoan.VaiTro });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { TenDangNhap, MatKhau } = req.body;
    
    if (!TenDangNhap || !MatKhau) {
      return res.status(400).json({ message: 'TenDangNhap and MatKhau are required' });
    }

    const taiKhoan = await TaiKhoan.findOne({ TenDangNhap });
    if (!taiKhoan) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(MatKhau, taiKhoan.MatKhau);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: taiKhoan._id, 
        VaiTro: taiKhoan.VaiTro, 
        TenDangNhap: taiKhoan.TenDangNhap 
      }, 
      process.env.JWT_SECRET || 'secretkey', 
      { expiresIn: '8h' }
    );

    res.json({ token, VaiTro: taiKhoan.VaiTro });
  } catch (err) { next(err); }
};
