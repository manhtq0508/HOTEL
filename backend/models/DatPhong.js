const mongoose = require('mongoose');

const DatPhongSchema = new mongoose.Schema({
    MaDatPhong: { type: String, required: true, unique: true },
    KhachHang: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'KhachHang', 
        required: true 
    },
    HangPhong: { 
        type: String, 
        enum: ['Normal', 'Standard', 'Premium', 'Luxury'], 
        required: true 
    },
    NgayDat: { type: Date, default: Date.now },
    NgayDen: { type: Date, required: true },
    NgayDi: { type: Date, required: true },
    SoKhach: { type: Number, required: true, min: 1 },
    TienCoc: { type: Number, default: 0 },
    TrangThai: { 
        type: String,
        enum: ['Pending','CheckedIn','CheckedOut','Cancelled', 'NoShow', 'DepositPaid', 'DepositCancel'], 
        default: 'Pending' 
    },
    ChiTietDatPhong: [{
        _id: false,
        MaCTDP: { type: String, required: true, unique: true },
        Phong: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Phong',
            required: true
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('DatPhong', DatPhongSchema);