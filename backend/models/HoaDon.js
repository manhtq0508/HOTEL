const mongoose = require('mongoose');

const HoaDonSchema = new mongoose.Schema({
    MaHD: { type: String, required: true, unique: true },
    PhieuThuePhong: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'PhieuThuePhong', 
        required: true 
    },
    NhanVienThuNgan: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'NhanVien', 
        required: true 
    },
    KhachHang: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'KhachHang', 
        required: true 
    },
    NgayLap: { type: Date, default: Date.now },
    TongTienPhong: { type: Number, default: 0, min: 0 },
    TongTienDichVu: { type: Number, default: 0, min: 0 },
    PhuThu: { type: Number, default: 0, min: 0 },
    TienBoiThuong: { type: Number, default: 0, min: 0 },
    TienDaCoc: { type: Number, default: 0, min: 0 },
    TongThanhToan: { type: Number, default: 0, min: 0 },
    PhuongThucThanhToan: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PhuongThucThanhToan',
        required: true 
    },
    ChiTietHoaDon: [{
        _id: false,
        MaCTHD: { type: String, required: true, unique: true },
        SoLuong: { type: Number, required: true, min: 1 },
        DonGia: { type: Number, required: true, min: 0 },
        ThanhTien: { type: Number, required: true, min: 0 }
    }]
}, { timestamps: true });

module.exports = mongoose.model('HoaDon', HoaDonSchema);