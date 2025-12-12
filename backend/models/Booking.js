const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  MaDatPhong: { type: String, required: true, unique: true },
  MaKH: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  MaPhong: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  NgayDen: { type: Date, required: true },
  NgayDi: { type: Date, required: true },
  TrangThai: { type: String, enum: ['Booked','CheckedIn','CheckedOut','Cancelled'], default: 'Booked' },
  TienCoc: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
