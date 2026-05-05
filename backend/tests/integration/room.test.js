const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Thiết lập các biến môi trường trước khi yêu cầu máy chủ
process.env.MONGO_URI = 'mongodb+srv://hotel:anh382382@hotel.qi1ejpi.mongodb.net/hotel_test_integration';
process.env.JWT_SECRET = 'secret'; // Use a fixed secret for tests if not in .env

const app = require('../../server');
const TaiKhoan = require('../../models/TaiKhoan');
const Phong = require('../../models/Phong');
const LoaiPhong = require('../../models/LoaiPhong');

describe('Room API Integration', () => {
    let token;
    let roomTypeId;
    let roomId;

    beforeAll(async () => {
       // Chờ kết nối sẵn sàng (server.js sẽ tự động kết nối khi tải trang) khi mongoose.connection.readyState === 1
        let tries = 0;
        while (mongoose.connection.readyState !== 1 && tries < 20) {
            await new Promise(r => setTimeout(r, 500));
            tries++;
        }

        // dọn sạch dữ liệu
        await TaiKhoan.deleteMany({});
        await Phong.deleteMany({});
        await LoaiPhong.deleteMany({});

        // tạo tài khoản admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);
        const admin = await TaiKhoan.create({
            TenDangNhap: 'admin_test',
            MatKhau: hashedPassword,
            VaiTro: 'Admin',
            TrangThai: 'Active'
        });

        token = jwt.sign(
            { id: admin._id, role: 'Admin', VaiTro: 'Admin' }, 
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // tạo loại phòng (vì phòng phải có loại phòng)
        const loaiPhong = await LoaiPhong.create({
            MaLoaiPhong: 'LP_TEST',
            TenLoaiPhong: 'TestSingle',
            Gia: 500000,
            SoNguoi: 2
        });
        roomTypeId = loaiPhong._id;
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    // test POST /api/rooms
    describe('POST /api/rooms', () => {
        // test 1 tạo phòng thành công
        it('should create a new room', async () => {
            const res = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    MaPhong: 'P101',
                    TenPhong: 'Room 101',
                    LoaiPhong: roomTypeId,
                    GiaPhong: 500000,
                    Tang: 1,
                    TrangThai: 'Available'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('MaPhong', 'P101');
            roomId = res.body._id;
        });
        // test 2 tạo phòng thất bại, thiếu dữ liệu
        it('should return 400 validation error if missing fields', async () => {
            const res = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    MaPhong: 'P102'
                    // Missing required keys
                });
            
            // Kiểm tra mã trạng thái 
            expect(res.statusCode).toBe(400);
        });
    });
// test GET /api/rooms
    describe('GET /api/rooms', () => {
        // test 1 lấy tất cả phòng thành công
        it('should get all rooms', async () => {
            const res = await request(app)
                .get('/api/rooms')
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });
        // test 2 lấy phòng theo id thành công
        it('should get room by id', async () => {
            const res = await request(app)
                .get(`/api/rooms/${roomId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('MaPhong', 'P101');
        });
    });
// test PUT /api/rooms/:id
    describe('PUT /api/rooms/:id', () => {
        // test 1 cập nhật phòng thành công
        it('should update room status', async () => {
            const res = await request(app)
                .put(`/api/rooms/${roomId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    TrangThai: 'Occupied'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('TrangThai', 'Occupied');
        });
    });
// test DELETE /api/rooms/:id
    describe('DELETE /api/rooms/:id', () => {
        // test 1 xóa phòng thành công
        it('should delete room', async () => {
            const res = await request(app)
                .delete(`/api/rooms/${roomId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            
            // Xác nhận phòng đã bị xóa
            const check = await Phong.findById(roomId);
            expect(check).toBeNull();
        });
    });
});
