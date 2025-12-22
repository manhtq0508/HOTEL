const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const itemRoutes = require('./routes/itemRoutes');

// Import middleware
const authMiddleware = require('./middleware/auth');

// Import models (for schema registration)
const TaiKhoan = require('./models/TaiKhoan');
const KhachHang = require('./models/KhachHang');
const NhanVien = require('./models/NhanVien');
const ChucVu = require('./models/ChucVu');
const Phong = require('./models/Phong');
const LoaiPhong = require('./models/LoaiPhong');
const DatPhong = require('./models/DatPhong');
const PhieuThuePhong = require('./models/PhieuThuePhong');
const DichVu = require('./models/DichVu');
const HoaDon = require('./models/HoaDon');
const PhuongThucThanhToan = require('./models/PhuongThucThanhToan');
const SuDungDichVu = require('./models/SuDungDichVu');
const LichSuDatPhong = require('./models/LichSuDatPhong');
const LichSuSuDungDichVu = require('./models/LichSuSuDungDichVu');
const PhieuBaoTri = require('./models/PhieuBaoTri');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://hotel:anh382382@hotel.qi1ejpi.mongodb.net/test';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/rooms', authMiddleware, roomRoutes);
app.use('/api/bookings', authMiddleware, bookingRoutes);
app.use('/api/services', authMiddleware, serviceRoutes);
app.use('/api/invoices', authMiddleware, invoiceRoutes);
app.use('/api/items', authMiddleware, itemRoutes);

// Health route
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
