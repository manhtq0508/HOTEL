const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Thiết lập biến môi trường
process.env.MONGO_URI = 'mongodb+srv://hotel:anh382382@hotel.qi1ejpi.mongodb.net/hotel_test_booking';
process.env.JWT_SECRET = 'secret';

const app = require('../../server');
const TaiKhoan = require('../../models/TaiKhoan');
const Phong = require('../../models/Phong');
const LoaiPhong = require('../../models/LoaiPhong');
const DatPhong = require('../../models/DatPhong');
const KhachHang = require('../../models/KhachHang');

// test booking API
describe('Booking API Integration', () => {
    jest.setTimeout(30000); // 30s timeout
    let token;
    let roomTypeId;
    let roomId;
    let customerId;
    const roomTypeName = 'Premium';

    beforeAll(async () => {
        // Wait for connection
        let tries = 0;
        while (mongoose.connection.readyState !== 1 && tries < 20) {
            await new Promise(r => setTimeout(r, 500));
            tries++;
        }

        // Dọn sạch dữ liệu
        await TaiKhoan.deleteMany({});
        await Phong.deleteMany({});
        await LoaiPhong.deleteMany({});
        await DatPhong.deleteMany({});
        await KhachHang.deleteMany({});

        // Tạo tài khoản admin
        const salt = await bcrypt.genSalt(10);
        const admin = await TaiKhoan.create({
            TenDangNhap: 'admin_booking_test',
            MatKhau: await bcrypt.hash('123456', salt),
            VaiTro: 'Admin',
            TrangThai: 'Active'
        });
        token = jwt.sign({ id: admin._id, role: 'Admin', VaiTro: 'Admin' }, process.env.JWT_SECRET);

        // Tạo loại phòng
        const lp = await LoaiPhong.create({
            MaLoaiPhong: 'LP_PRE',
            TenLoaiPhong: roomTypeName
        });
        roomTypeId = lp._id;

        // Tạo phòng
        const p = await Phong.create({
            MaPhong: 'P_PRE_01',
            LoaiPhong: roomTypeId,
            GiaPhong: 1000000,
            TrangThai: 'Available'
        });
        roomId = p._id;

        // Tạo khách hàng
        const kh = await KhachHang.create({
            MaKH: 'KH_TEST_01',
            HoTen: 'Test Customer',
            CMND: '123456789',
            SDT: '0909000111',
            Email: 'testcust@example.com'
        });
        customerId = kh._id;
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    // test POST /api/bookings
    describe('POST /api/bookings', () => {
        // test 1 tạo booking thành công
        it('should create a booking successfully when room is available', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    KhachHang: customerId,
                    HangPhong: roomTypeName, // "Deluxe"
                    NgayDen: '2023-12-01',
                    NgayDi: '2023-12-05',
                    SoKhach: 2
                });

            expect(res.statusCode).toBe(200);
            expect([200, 201]).toContain(res.statusCode);
            
            expect(res.body).toHaveProperty('MaDatPhong');
            expect(res.body.ChiTietDatPhong).toHaveLength(1);
            expect(res.body.ChiTietDatPhong[0].Phong).toBe(roomId.toString());
        });

        // test 2 tạo booking thất bại, phòng đã được đặt
        it('should fail when booking overlapping dates for the same room category (if only 1 room)', async () => {
            // đặt phòng trùng ngày với phòng đã được đặt
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    KhachHang: customerId,
                    HangPhong: roomTypeName,
                    NgayDen: '2023-12-02', // Overlaps with 01-05
                    NgayDi: '2023-12-04',
                    SoKhach: 2
                });
            
            if (res.statusCode !== 400) {
                 console.error('Overlap Booking Unexpected Status:', res.statusCode, res.body);
            }
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/Không còn phòng trống/);
        });

        // test 3 tạo booking thất bại, thiếu thông tin
        it('should validate missing fields', async () => {
             const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    KhachHang: customerId
                    // thiếu thông tin
                });
            expect(res.statusCode).toBe(400);
        });
    });
});
