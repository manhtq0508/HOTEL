const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  MaHD: { type: String, required: true, unique: true },
  MaDatPhong: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  Items: [
    {
      type: { type: String, enum: ['Room','Service'], required: true },
      refId: { type: mongoose.Schema.Types.ObjectId, required: true },
      SoLuong: { type: Number, default: 1 },
      ThanhTien: { type: Number, required: true },
    }
  ],
  TongTien: { type: Number, default: 0 },
  NgayLap: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);
