const mongoose = require('mongoose');

const KhachHangSchema = new mongoose.Schema({
    MaKH: { type: String, required: true, unique: true },
    TaiKhoan: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'TaiKhoan', 
        unique: true, 
        sparse: true
    },
    HoTen: { type: String, required: true },
    CMND: { type: String, required: true, unique: true },
    SDT: { type: String, required: true },
    Email: { type: String, required: true, unique: true },
    DiaChi: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('KhachHang', KhachHangSchema);