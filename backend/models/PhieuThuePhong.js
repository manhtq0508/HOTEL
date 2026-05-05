const mongoose = require('mongoose');

const PhieuThuePhongSchema = new mongoose.Schema({
    MaPTP: { type: String, required: true, unique: true },
    DatPhong: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'DatPhong', 
        required: true 
    },
    Phong: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Phong', 
        required: true 
    },
    NgayNhanPhong: { type: Date, default: Date.now },
    NgayTraDuKien: { type: Date, required: true },
    SoKhachThucTe: { type: Number, required: true, min: 1 },
    DonGiaSauDieuChinh: { type: Number, required: true },
    NhanVienCheckIn: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'NhanVien', 
        required: true 
    },
    TrangThai: { 
        type: String, 
        enum: ['CheckedIn', 'CheckedOut'], 
        default: 'CheckedIn'
    }
}, { timestamps: true });

module.exports = mongoose.model('PhieuThuePhong', PhieuThuePhongSchema);