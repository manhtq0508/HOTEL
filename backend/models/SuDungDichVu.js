const mongoose = require('mongoose');

const SuDungDichVuSchema = new mongoose.Schema({
    MaSDDV: { type: String, required: true, unique: true },
    PhieuThuePhong: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'PhieuThuePhong', 
        required: true 
    },
    DichVu: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'DichVu', 
        required: true 
    },
    SoLuong: { type: Number, required: true, min: 1 },
    DonGia: { type: Number, required: true, min: 0 },
    ThanhTien: { type: Number, required: true, min: 0 },
    ThoiDiemYeuCau: { type: Date, default: Date.now },
    TrangThai: { 
        type: String, 
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], 
        default: 'Pending' 
    }
}, { timestamps: true });

module.exports = mongoose.model('SuDungDichVu', SuDungDichVuSchema);