const mongoose = require('mongoose');

const LichSuSuDungDichVuSchema = new mongoose.Schema({
    MaLSDV: { type: String, required: true, unique: true },
    SuDungDichVu: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'SuDungDichVu', 
        required: true 
    },
    TrangThaiCu: { 
        type: String, 
        enum: ["Pending", "In Progress", "Completed", "Cancelled"], 
        required: true 
    },
    TrangThaiMoi: { 
        type: String, 
        enum: ["Pending", "In Progress", "Completed", "Cancelled"], 
        required: true 
    },
    ThoiGian: { type: Date, default: Date.now },
    TaiKhoan: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'TaiKhoan'
    }
}, { timestamps: true });

module.exports = mongoose.model('LichSuSuDungDichVu', LichSuSuDungDichVuSchema);