const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  MaKH: { type: String, required: true, unique: true },
  HoTen: { type: String, required: true },
  CMND: String,
  SDT: String,
  Email: String,
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
