const mongoose = require('mongoose');

const LichSuDatPhongSchema = new mongoose.Schema({
    MaLSDP: { type: String, required: true, unique: true },
    DatPhong: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'DatPhong', 
        required: true 
    },
    TrangThaiCu: { type: String, 
        enum: ['Pending','CheckedIn','CheckedOut','Cancelled', 'NoShow'],
        required: true
    },
    TrangThaiMoi: { type: String, 
        enum: ['Pending','CheckedIn','CheckedOut','Cancelled', 'NoShow'],
        required: true 
    },
    ThoiGian: { type: Date, default: Date.now },
    TaiKhoan: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaiKhoan'
    }
}, { timestamps: true });

module.exports = mongoose.model('LichSuDatPhong', LichSuDatPhongSchema);