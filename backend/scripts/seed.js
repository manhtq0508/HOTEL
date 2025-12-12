const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Customer = require('../models/Customer');
const Room = require('../models/Room');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://hotel:anh382382@hotel.qi1ejpi.mongodb.net/';

async function connectWithFallback() {
  // try external first with short timeout
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5s timeout
    });
    console.log('Connected to external MongoDB:', MONGO_URI);
    return { mongod: null };
  } catch (err) {
    console.warn('External MongoDB connection failed:', err.message);
    // try to use mongodb-memory-server fallback
    let MongoMemoryServer;
    try {
      MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
    } catch (e) {
      console.error('mongodb-memory-server is not installed. Install with: npm install --save-dev mongodb-memory-server');
      throw new Error('No MongoDB available and mongodb-memory-server not installed.');
    }
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to in-memory MongoDB:', uri);
    return { mongod };
  }
}

async function seed() {
  let mongodInstance = null;
  try {
    const res = await connectWithFallback();
    mongodInstance = res.mongod;

    // wipe collections
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Room.deleteMany({}),
      Service.deleteMany({}),
      Booking.deleteMany({}),
      Invoice.deleteMany({}),
    ]);

    // create users
    const usersData = [
      { username: 'admin', password: 'admin123', role: 'Admin', name: 'Admin' },
      { username: 'reception', password: 'recep123', role: 'Reception', name: 'Reception' },
    ];
    const users = [];
    for (const u of usersData) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(u.password, salt);
      const created = await User.create({ username: u.username, passwordHash, role: u.role, name: u.name });
      users.push(created);
    }

    // create customers
    const customersData = [
      { MaKH: 'KH001', HoTen: 'Nguyen Van A', CMND: '123456789', SDT: '0900000001', Email: 'a@example.com' },
      { MaKH: 'KH002', HoTen: 'Tran Thi B', CMND: '987654321', SDT: '0900000002', Email: 'b@example.com' },
    ];
    const customers = await Customer.insertMany(customersData);

    // create rooms
    const roomsData = [
      { MaPhong: 'P101', LoaiPhong: 'Single', DonGia: 300000, TinhTrang: 'Available' },
      { MaPhong: 'P102', LoaiPhong: 'Double', DonGia: 500000, TinhTrang: 'Available' },
      { MaPhong: 'P201', LoaiPhong: 'Suite', DonGia: 1000000, TinhTrang: 'Available' },
    ];
    const rooms = await Room.insertMany(roomsData);

    // create services
    const servicesData = [
      { MaDV: 'DV01', TenDV: 'Breakfast', DonGia: 50000 },
      { MaDV: 'DV02', TenDV: 'Laundry', DonGia: 30000 },
    ];
    const services = await Service.insertMany(servicesData);

    // create bookings
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const after3 = new Date(now);
    after3.setDate(now.getDate() + 3);

    const bookingsData = [
      {
        MaDatPhong: 'DP001',
        MaKH: customers[0]._id,
        MaPhong: rooms[0]._id,
        NgayDen: tomorrow,
        NgayDi: after3,
        TrangThai: 'Booked',
        TienCoc: 100000,
      },
    ];
    const bookings = await Booking.insertMany(bookingsData);

    // update room status for booked rooms
    await Room.findByIdAndUpdate(rooms[0]._id, { TinhTrang: 'Booked' });

    // create invoice for booking (room charge)
    const booking = bookings[0];
    const room = await Room.findById(booking.MaPhong);
    const nights = Math.max(1, Math.ceil((new Date(booking.NgayDi) - new Date(booking.NgayDen)) / (1000*60*60*24)));
    const roomAmount = (room.DonGia || 0) * nights;

    const invoice1 = await Invoice.create({
      MaHD: 'HD001',
      MaDatPhong: booking._id,
      Items: [
        { type: 'Room', refId: room._id, SoLuong: nights, ThanhTien: roomAmount }
      ],
      TongTien: roomAmount,
    });

    // create invoice with service
    const svc = services[0];
    const svcAmount = (svc.DonGia || 0) * 2;
    const invoice2 = await Invoice.create({
      MaHD: 'HD002',
      Items: [
        { type: 'Service', refId: svc._id, SoLuong: 2, ThanhTien: svcAmount }
      ],
      TongTien: svcAmount,
    });

    console.log('Seed completed:');
    console.log('Users:', users.map(u => u.username));
    console.log('Customers:', customers.map(c => c.MaKH));
    console.log('Rooms:', rooms.map(r => r.MaPhong));
    console.log('Services:', services.map(s => s.MaDV));
    console.log('Bookings:', bookings.map(b => b.MaDatPhong));
    console.log('Invoices:', [invoice1.MaHD, invoice2.MaHD]);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    try { await mongoose.disconnect(); } catch(e){/* ignore */ }
    if (typeof mongodInstance !== 'undefined' && mongodInstance && typeof mongodInstance.stop === 'function') {
      await mongodInstance.stop();
      console.log('Stopped in-memory MongoDB');
    }
    process.exit(0);
  }
}

seed();
