const mongoose = require('mongoose');

const NhanVienSchema = new mongoose.Schema({
    MaNV: { type: String, required: true, unique: true },
    TaiKhoan: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaiKhoan',
        unique: true,
        sparse: true
    },
    HoTen: { type: String, required: true },
    ChucVu: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChucVu',
        required: true
    },
    SDT: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('NhanVien', NhanVienSchema);