const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();


// Import routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const itemRoutes = require('./routes/itemRoutes');
const positionRoutes = require('./routes/positionRoutes');
const staffRoutes = require('./routes/staffRoutes');
const accountRoutes = require('./routes/accountRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const rentalReceiptRoutes = require('./routes/rentalReceiptRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const serviceUsageRoutes = require('./routes/serviceUsageRoutes');
const bookingHistoryRoutes = require('./routes/bookingHistoryRoutes');
const serviceUsageHistoryRoutes = require('./routes/serviceUsageHistoryRoutes');
const datPhongRoutes = require('./routes/datPhongRoutes');
const roomTypeRoutes = require('./routes/roomTypeRoutes');
const settingRoutes = require('./routes/settingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const forecastRoutes = require('./routes/forecastRoutes');

const stripeRoutes = require('./routes/stripeRoutes');

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
const MONGO_URI = process.env.MONGO_URI || (() => { throw new Error('MONGO_URI is not defined in environment variables'); })();
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
app.use('/api/positions', authMiddleware, positionRoutes);
app.use('/api/staff', authMiddleware, staffRoutes);
app.use('/api/accounts', authMiddleware, accountRoutes);
app.use('/api/payment-methods', authMiddleware, paymentMethodRoutes);
app.use('/api/rental-receipts', authMiddleware, rentalReceiptRoutes);
app.use('/api/maintenance', authMiddleware, maintenanceRoutes);
app.use('/api/service-usages', authMiddleware, serviceUsageRoutes);
app.use('/api/booking-history', authMiddleware, bookingHistoryRoutes);
app.use('/api/service-usage-history', authMiddleware, serviceUsageHistoryRoutes);
app.use('/api/dat-phong', authMiddleware, datPhongRoutes);
app.use('/api/room-types', authMiddleware, roomTypeRoutes);
app.use('/api/settings', authMiddleware, settingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/forecast', authMiddleware, forecastRoutes);

app.use('/api/stripe', stripeRoutes);

// Health route
app.get('/api/health', (req, res) => res.json({ ok: true }));


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong!' });
});


// Start server
const PORT = process.env.PORT || 5001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}


module.exports = app;


async function seedAdminAccount() {
  try {
    const TenDangNhap = process.env.ADMIN_USERNAME || (() => { throw new Error('ADMIN_USERNAME is not defined in environment variables'); })();
    const plainPassword = process.env.ADMIN_PASSWORD || (() => { throw new Error('ADMIN_PASSWORD is not defined in environment variables'); })();

    const existing = await TaiKhoan.findOne({ TenDangNhap });

    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const matKhauHash = await bcrypt.hash(plainPassword, salt);

      await TaiKhoan.create({
        TenDangNhap,
        MatKhau: matKhauHash,
        VaiTro: 'Admin',
      });

      console.log('[seed] Admin account created!');
      return;
    }

    const updates = {};

    if (existing.VaiTro !== 'Admin') {
      updates.VaiTro = 'Admin';
    }

    const passwordMatches = await bcrypt.compare(plainPassword, existing.MatKhau);
    if (!passwordMatches) {
      const salt = await bcrypt.genSalt(10);
      updates.MatKhau = await bcrypt.hash(plainPassword, salt);
    }

    if (Object.keys(updates).length > 0) {
      await TaiKhoan.updateOne({ _id: existing._id }, { $set: updates });
      console.log('[seed] Admin account updated!');
    } else {
      console.log('[seed] Admin account exists!');
    }
  } catch (err) {
    console.error('[seed] Admin account seed failed:', err);
  }
}

// Run seed once DB is ready
if (mongoose.connection.readyState === 1) {
  seedAdminAccount();
} else {
  mongoose.connection.once('open', () => {
    seedAdminAccount();
  });
}



