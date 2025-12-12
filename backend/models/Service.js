const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  MaDV: { type: String, required: true, unique: true },
  TenDV: { type: String, required: true },
  DonGia: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Service', ServiceSchema);
