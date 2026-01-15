const mongoose = require('mongoose');

const PhongSchema = new mongoose.Schema({
    MaPhong: { type: String, required: true, unique: true },
    LoaiPhong: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'LoaiPhong', 
        required: true 
    },
    GiaPhong: { type: Number, required: true },
    TrangThai: { 
        type: String, 
        enum: ['Available', 'Occupied', 'Maintenance', 'Reserved'], 
        default: 'Available' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Phong', PhongSchema);