const mongoose = require('mongoose');

const ChucVuSchema = new mongoose.Schema({
    MaChucVu: { type: String, required: true, unique: true },
    TenChucVu: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ChucVu', ChucVuSchema);