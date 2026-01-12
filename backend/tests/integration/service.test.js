const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Thiết lập biến môi trường
process.env.MONGO_URI = 'mongodb+srv://hotel:anh382382@hotel.qi1ejpi.mongodb.net/hotel_test_integration';
process.env.JWT_SECRET = 'secret';

const app = require('../../server');
const TaiKhoan = require('../../models/TaiKhoan');
const DichVu = require('../../models/DichVu');

describe('Service API Integration', () => {
    let token;
    let serviceId;

    beforeAll(async () => {
        // Chờ kết nối
        let tries = 0;
        while (mongoose.connection.readyState !== 1 && tries < 20) {
            await new Promise(r => setTimeout(r, 500));
            tries++;
        }

        // Dọn dẹp dữ liệu
        await TaiKhoan.deleteMany({});
        await DichVu.deleteMany({});

        // Tạo tài khoản Admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);
        const admin = await TaiKhoan.create({
            TenDangNhap: 'admin_service_test',
            MatKhau: hashedPassword,
            VaiTro: 'Admin',
            TrangThai: 'Active'
        });

        // Tạo Token
        token = jwt.sign(
            { id: admin._id, role: 'Admin', VaiTro: 'Admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    // TEST POST /api/services
    describe('POST /api/services', () => {
        it('should create a new service', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    MaDV: 'DV001',
                    TenDV: 'Laundry',
                    DonGia: 50000
                });

            expect(res.statusCode).toBe(200); 
            expect(res.body).toHaveProperty('MaDV', 'DV001');
            serviceId = res.body._id;
        });

        it('should return 400 if missing fields', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    MaDV: 'DV002'
                    // Missing TenDV
                });
            
            expect(res.statusCode).not.toBe(200);
            expect(res.statusCode).not.toBe(201);
        });
    });

    // TEST GET /api/services
    describe('GET /api/services', () => {
        it('should get all services', async () => {
            const res = await request(app)
                .get('/api/services')
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });

        it('should get service by id', async () => {
            const res = await request(app)
                .get(`/api/services/${serviceId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('MaDV', 'DV001');
        });
    });

    // TEST PUT /api/services/:id
    describe('PUT /api/services/:id', () => {
        it('should update service price', async () => {
            const res = await request(app)
                .put(`/api/services/${serviceId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    DonGia: 60000
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('DonGia', 60000);
        });
    });

    // TEST DELETE /api/services/:id
    describe('DELETE /api/services/:id', () => {
        it('should delete service', async () => {
            const res = await request(app)
                .delete(`/api/services/${serviceId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            
            // xác nhận xóa
            const check = await DichVu.findById(serviceId);
            expect(check).toBeNull();
        });
    });
});
