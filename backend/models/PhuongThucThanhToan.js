const mongoose = require('mongoose');

const PhuongThucThanhToanSchema = new mongoose.Schema({
    MaPTTT: { type: String, required: true, unique: true },
    TenPTTT: { type: String, required: true }
}, {timestamps: true });

module.exports = mongoose.model('PhuongThucThanhToan', PhuongThucThanhToanSchema);