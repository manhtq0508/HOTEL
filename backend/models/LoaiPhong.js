const mongoose = require('mongoose');

const LoaiPhongSchema = new mongoose.Schema({
    MaLoaiPhong: { type: String, required: true, unique: true },
    TenLoaiPhong: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('LoaiPhong', LoaiPhongSchema);