const mongoose = require('mongoose');

const DichVuSchema = new mongoose.Schema({
    MaDV: { type: String, required: true, unique: true },
    TenDV: { type: String, required: true },
    DonGia: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('DichVu', DichVuSchema);