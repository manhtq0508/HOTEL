const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  MaPhong: { type: String, required: true, unique: true },
  TinhTrang: { type: String, enum: ['Available','Booked','Occupied','Maintenance'], default: 'Available' },
  LoaiPhong: String,
  DonGia: { type: Number, default: 0 },
  GhiChu: String,
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
