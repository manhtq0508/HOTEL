const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const ChucVu = require('../models/ChucVu.js');
const DatPhong = require('../models/DatPhong.js');
const DichVu = require('../models/DichVu.js');
const HoaDon = require('../models/HoaDon.js');
const KhachHang = require('../models/KhachHang.js');
const LichSuDatPhong = require('../models/LichSuDatPhong.js');
const LichSuSuDungDichVu = require('../models/LichSuSuDungDichVu.js');
const LoaiPhong = require('../models/LoaiPhong.js');
const NhanVien = require('../models/NhanVien.js');
const PhieuBaoTri = require('../models/PhieuBaoTri.js');
const PhieuThuePhong = require('../models/PhieuThuePhong.js');
const Phong = require('../models/Phong.js');
const PhuongThucThanhToan = require('../models/PhuongThucThanhToan.js');
const SuDungDichVu = require('../models/SuDungDichVu.js');
const TaiKhoan = require('../models/TaiKhoan.js');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://hotel:anh382382@hotel.qi1ejpi.mongodb.net/test";

async function connectDatabase() {
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Connected to MongoDB:', MONGO_URI);
    }
    catch (err) {
        console.error('MongoDB connection error:', err.message);
        throw err;
    }
}

async function wipeDatabase() {
    await Promise.all([
        ChucVu.deleteMany({}),
        DatPhong.deleteMany({}),
        DichVu.deleteMany({}),
        HoaDon.deleteMany({}),
        KhachHang.deleteMany({}),
        LichSuDatPhong.deleteMany({}),
        LichSuSuDungDichVu.deleteMany({}),
        LoaiPhong.deleteMany({}),
        NhanVien.deleteMany({}),
        PhieuBaoTri.deleteMany({}),
        PhieuThuePhong.deleteMany({}),
        Phong.deleteMany({}),
        PhuongThucThanhToan.deleteMany({}),
        SuDungDichVu.deleteMany({}),
        TaiKhoan.deleteMany({})
    ]);

    console.log('Wiped all collections');
}

async function seed() {
    try {
        await connectDatabase();
        await wipeDatabase();

        //!IMPORTANT Lưu ý: Hãy giữ nguyên thứ tự các hàm seed dưới đây để tránh lỗi khóa ngoại
        await seedTaiKhoan();
        await seedChucVu();
        await seedDichVu();
        await seedLoaiPhong();
        await seedPhong();
        await seedPhuongThucThanhToan();
        await seedKhachHang();
        await seedNhanVien();
        await seedPhieuBaoTri();
        await seedDatPhong();
        await seedPhieuThuePhong();
        await seedSuDungDichVu();
        await seedHoaDon();
        await seedLichSuDatPhong();
        await seedLichSuSuDungDichVu();

        console.log('=== Seeding completed successfully ===');
    }
    catch (err) {
        console.error('Seeding failed:', err);
    }
    finally {
        mongoose.connection.close();
    }
}

async function seedTaiKhoan() {
    console.log('=> Seeding TaiKhoan data...');
    const taiKhoanData = [
        { TenDangNhap: 'admin', MatKhau: 'admin@123', VaiTro: 'Admin' },
        { TenDangNhap: 'manager', MatKhau: 'manager@123', VaiTro: 'Manager' },
        { TenDangNhap: 'receptionist', MatKhau: 'receptionist@123', VaiTro: 'Receptionist' },
        { TenDangNhap: 'maintenancestaff', MatKhau: 'maintenancestaff@123', VaiTro: 'MaintenanceStaff' },
        { TenDangNhap: 'customer1', MatKhau: 'customer1@123', VaiTro: 'Customer' },
        { TenDangNhap: 'customer2', MatKhau: 'customer2@123', VaiTro: 'Customer' },
        { TenDangNhap: 'customer3', MatKhau: 'customer3@123', VaiTro: 'Customer' }
    ];

    const hashedTaiKhoanData = await Promise.all(taiKhoanData.map(async (tk) => {
        const hashedPassword = await bcrypt.hash(tk.MatKhau, 10);
        return { ...tk, MatKhau: hashedPassword };
    }));

    await TaiKhoan.insertMany(hashedTaiKhoanData);
    console.log('=> Seeded TaiKhoan data');
}

async function seedChucVu() {
    console.log('=> Seeding ChucVu data...');
    const chucVuData = [
        { MaChucVu: 'CV01', TenChucVu: 'Admin' },
        { MaChucVu: 'CV02', TenChucVu: 'Quản Lý' },
        { MaChucVu: 'CV03', TenChucVu: 'Lễ Tân' },
        { MaChucVu: 'CV04', TenChucVu: 'Nhân Viên Bảo Trì' },
        { MaChucVu: 'CV05', TenChucVu: 'Nhân Viên Dọn Dẹp' }
    ];
    await ChucVu.insertMany(chucVuData);
    console.log('=> Seeded ChucVu data');
}

async function seedDichVu() {
    console.log('=> Seeding DichVu data...');
    const dichVuData = [
        { MaDV: 'DV01', TenDV: 'Dịch Vụ Phòng', DonGia: 20000 },
        { MaDV: 'DV02', TenDV: 'Dịch Vụ Giặt Ủi', DonGia: 15000 },
        { MaDV: 'DV03', TenDV: 'Dịch Vụ Spa', DonGia: 50000 }
    ];
    await DichVu.insertMany(dichVuData);
    console.log('=> Seeded DichVu data');
}

async function seedLoaiPhong() {
    console.log('=> Seeding LoaiPhong data...');
    const loaiPhongData = [
        { MaLoaiPhong: 'LP01', TenLoaiPhong: 'Phòng Đơn' },
        { MaLoaiPhong: 'LP02', TenLoaiPhong: 'Phòng Đôi' },
    ];
    await LoaiPhong.insertMany(loaiPhongData);
    console.log('=> Seeded LoaiPhong data');
}

async function seedPhong() {
    console.log('=> Seeding Phong data...');
    const loaiPhongIDs = await LoaiPhong.find().select('_id TenLoaiPhong').lean();
    const phongData = [
        { MaPhong: 'P101', LoaiPhong: loaiPhongIDs.find(lp => lp.TenLoaiPhong === 'Phòng Đơn')._id, TrangThai: 'Maintenance', GiaPhong: 300000 },
        { MaPhong: 'P102', LoaiPhong: loaiPhongIDs.find(lp => lp.TenLoaiPhong === 'Phòng Đôi')._id, TrangThai: 'Maintenance', GiaPhong: 500000 },
        { MaPhong: 'P201', LoaiPhong: loaiPhongIDs.find(lp => lp.TenLoaiPhong === 'Phòng Đơn')._id, TrangThai: 'Reserved', GiaPhong: 250000 },
        { MaPhong: 'P202', LoaiPhong: loaiPhongIDs.find(lp => lp.TenLoaiPhong === 'Phòng Đôi')._id, TrangThai: 'Occupied', GiaPhong: 600000 },
        { MaPhong: 'P301', LoaiPhong: loaiPhongIDs.find(lp => lp.TenLoaiPhong === 'Phòng Đơn')._id, TrangThai: 'NeedCleaning', GiaPhong: 400000 },
        { MaPhong: 'P302', LoaiPhong: loaiPhongIDs.find(lp => lp.TenLoaiPhong === 'Phòng Đôi')._id, TrangThai: 'Available', GiaPhong: 900000 },
        { MaPhong: 'P401', LoaiPhong: loaiPhongIDs.find(lp => lp.TenLoaiPhong === 'Phòng Đơn')._id, TrangThai: 'Available', GiaPhong: 230000 },
        { MaPhong: 'P402', LoaiPhong: loaiPhongIDs.find(lp => lp.TenLoaiPhong === 'Phòng Đôi')._id, TrangThai: 'Available', GiaPhong: 550000 }
    ];
    await Phong.insertMany(phongData);
    console.log('=> Seeded Phong data');
}

async function seedPhuongThucThanhToan() {
    console.log('=> Seeding PhuongThucThanhToan data...');
    const phuongThucThanhToanData = [
        { MaPTTT: 'PTTT01', TenPTTT: 'Tiền mặt' },
        { MaPTTT: 'PTTT02', TenPTTT: 'Thẻ tín dụng' }
    ];
    await PhuongThucThanhToan.insertMany(phuongThucThanhToanData);
    console.log('=> Seeded PhuongThucThanhToan data');
}

async function seedKhachHang() {
    console.log('=> Seeding KhachHang data...');
    const accountIDs = await TaiKhoan.find({ VaiTro: 'Customer' }).select('_id').lean();

    const khachHangData = [
        { MaKH: 'KH001', TaiKhoan: accountIDs[0]._id, HoTen: 'Nguyen Van A', CMND: '123456789', SDT: '0900000001', Email: 'nguyenvana@example.com' },
        { MaKH: 'KH002', TaiKhoan: accountIDs[1]._id, HoTen: 'Tran Thi B', CMND: '987654321', SDT: '0900000002', Email: 'tranthib@example.com' },
        { MaKH: 'KH003', TaiKhoan: accountIDs[2]._id, HoTen: 'Le Van C', CMND: '456789123', SDT: '0900000003', Email: 'levanc@example.com' },
        { MaKH: 'KH004', HoTen: 'Pham Thi D', CMND: '789123456', SDT: '0900000004', Email: 'phamthid@example.com' },
        { MaKH: 'KH005', HoTen: 'Hoang Van E', CMND: '321654987', SDT: '0900000005', Email: 'hoangvane@example.com' }
    ];

    await KhachHang.insertMany(khachHangData);
    console.log('=> Seeded KhachHang data');
}

async function seedNhanVien() {
    console.log('=> Seeding NhanVien data...');
    const positionIDs = await ChucVu.find().select('_id TenChucVu').lean();
    const accountIDs = await TaiKhoan.find({ VaiTro: { $in: ['Admin', 'Manager', 'Receptionist', 'MaintenanceStaff'] } }).select('_id').lean();

    const nhanVienData = [
        { MaNV: 'NV001', TaiKhoan: accountIDs[0]._id, HoTen: 'Le Thi X', ChucVu: positionIDs.find(p => p.TenChucVu === 'Admin')._id, SDT: '0912345678' },
        { MaNV: 'NV002', TaiKhoan: accountIDs[1]._id, HoTen: 'Tran Van Y', ChucVu: positionIDs.find(p => p.TenChucVu === 'Quản Lý')._id, SDT: '0987654321' },
        { MaNV: 'NV003', TaiKhoan: accountIDs[2]._id, HoTen: 'Nguyen Thi Z', ChucVu: positionIDs.find(p => p.TenChucVu === 'Lễ Tân')._id, SDT: '0922334455' },
        { MaNV: 'NV004', TaiKhoan: accountIDs[3]._id, HoTen: 'Pham Van W', ChucVu: positionIDs.find(p => p.TenChucVu === 'Nhân Viên Bảo Trì')._id, SDT: '0977554433' },
        { MaNV: 'NV005', HoTen: 'Do Thi V', ChucVu: positionIDs.find(p => p.TenChucVu === 'Nhân Viên Dọn Dẹp')._id, SDT: '0933667788' }
    ];

    await NhanVien.insertMany(nhanVienData);
    console.log('=> Seeded NhanVien data');
}

async function seedPhieuBaoTri() {
    console.log('=> Seeding PhieuBaoTri data...');
    const phongP101ID = await Phong.findOne({ MaPhong: 'P101' }).select('_id').lean();
    const phongP102ID = await Phong.findOne({ MaPhong: 'P102' }).select('_id').lean();
    const nvBaoTriID = await NhanVien.findOne({ MaNV: 'NV004' }).select('_id').lean();

    // Mặc định là ngày hiện tại
    const phieuBaoTriData = [
        { MaPBT: 'PBT001', Phong: phongP101ID._id, NVKyThuat: nvBaoTriID._id, NoiDung: 'Sửa điều hòa không mát' },
        { MaPBT: 'PBT002', Phong: phongP102ID._id, NVKyThuat: nvBaoTriID._id, NoiDung: 'Thay bóng đèn hỏng' }
    ];
    await PhieuBaoTri.insertMany(phieuBaoTriData);
    console.log('=> Seeded PhieuBaoTri data');
}

async function seedDatPhong() {
    console.log('=> Seeding DatPhong data...');
    const khachHangIDs = await KhachHang.find().select('_id MaKH').lean();
    const phongIDs = await Phong.find().select('_id MaPhong').lean();

    const datPhongData = [
        {
            MaDatPhong: 'DP001',
            KhachHang: khachHangIDs.find(kh => kh.MaKH === 'KH001')._id,
            HangPhong: 'Standard',
            NgayDen: new Date('2025-12-01'),
            NgayDi: new Date('2025-12-30'),
            SoKhach: 2,
            TienCoc: 500000,
            TrangThai: 'Pending',
            ChiTietDatPhong: [
                {
                    MaCTDP: 'CTDP001',
                    Phong: phongIDs.find(p => p.MaPhong === 'P201')._id
                }
            ]
        },
        {
            MaDatPhong: 'DP002',
            KhachHang: khachHangIDs.find(kh => kh.MaKH === 'KH002')._id,
            HangPhong: 'Premium',
            NgayDen: new Date('2025-12-01'),
            NgayDi: new Date('2025-12-30'),
            SoKhach: 3,
            TienCoc: 800000,
            TrangThai: 'CheckedIn',
            ChiTietDatPhong: [
                {
                    MaCTDP: 'CTDP002',
                    Phong: phongIDs.find(p => p.MaPhong === 'P202')._id
                }
            ]
        },
        {
            MaDatPhong: 'DP003',
            KhachHang: khachHangIDs.find(kh => kh.MaKH === 'KH003')._id,
            HangPhong: 'Luxury',
            NgayDen: new Date('2024-07-20'),
            NgayDi: new Date('2024-07-25'),
            SoKhach: 4,
            TienCoc: 1200000,
            TrangThai: 'Cancelled',
            ChiTietDatPhong: [
                {
                    MaCTDP: 'CTDP003',
                    Phong: phongIDs.find(p => p.MaPhong === 'P302')._id
                }
            ]
        },
        {
            MaDatPhong: 'DP004',
            KhachHang: khachHangIDs.find(kh => kh.MaKH === 'KH004')._id,
            HangPhong: 'Normal',
            NgayDen: new Date('2024-08-01'),
            NgayDi: new Date('2024-08-03'),
            SoKhach: 1,
            TienCoc: 200000,
            TrangThai: 'NoShow',
            ChiTietDatPhong: [
                {
                    MaCTDP: 'CTDP004',
                    Phong: phongIDs.find(p => p.MaPhong === 'P401')._id
                }
            ]
        },
        {
            MaDatPhong: 'DP005',
            KhachHang: khachHangIDs.find(kh => kh.MaKH === 'KH005')._id,
            HangPhong: 'Standard',
            NgayDen: new Date('2024-08-05'),
            NgayDi: new Date('2024-08-10'),
            SoKhach: 2,
            TienCoc: 600000,
            TrangThai: 'CheckedOut',
            ChiTietDatPhong: [
                {
                    MaCTDP: 'CTDP005',
                    Phong: phongIDs.find(p => p.MaPhong === 'P402')._id
                }
            ]
        }
    ];

    await DatPhong.insertMany(datPhongData);
    console.log('=> Seeded DatPhong data');
}

async function seedPhieuThuePhong() {
    console.log('=> Seeding PhieuThuePhong data...');
    const datPhongDaCheckedIn = await DatPhong.findOne({ TrangThai: 'CheckedIn' }).select('_id MaDatPhong').lean();
    const datPhongDaCheckedOut = await DatPhong.findOne({ TrangThai: 'CheckedOut' }).select('_id MaDatPhong').lean();
    const phongCheckInP202 = await Phong.findOne({ MaPhong: 'P202' }).select('_id').lean();
    const phongCheckOutP402 = await Phong.findOne({ MaPhong: 'P402' }).select('_id').lean();
    const nvLeTanID = await NhanVien.findOne({ MaNV: 'NV003' }).select('_id').lean();

    const phieuThuePhongData = [
        { MaPTP: 'PTP001', DatPhong: datPhongDaCheckedIn._id, Phong: phongCheckInP202._id, NgayNhanPhong: new Date('2025-12-01'), NgayTraDuKien: new Date('2025-12-30'), SoKhachThucTe: 3, DonGiaSauDieuChinh: 600000, NhanVienCheckIn: nvLeTanID._id, TrangThai: 'CheckedIn' },
        { MaPTP: 'PTP002', DatPhong: datPhongDaCheckedOut._id, Phong: phongCheckOutP402._id, NgayNhanPhong: new Date('2024-08-05'), NgayTraDuKien: new Date('2024-08-10'), SoKhachThucTe: 2, DonGiaSauDieuChinh: 550000, NhanVienCheckIn: nvLeTanID._id, TrangThai: 'CheckedOut' }
    ];

    await PhieuThuePhong.insertMany(phieuThuePhongData);
    console.log('=> Seeded PhieuThuePhong data');
}

async function seedSuDungDichVu() {
    console.log('=> Seeding SuDungDichVu data...');
    const phieuThuePhongCheckedIn = await PhieuThuePhong.findOne({ TrangThai: 'CheckedIn' }).select('_id MaPTP').lean();
    const phieuThuePhongCheckedOut = await PhieuThuePhong.findOne({ TrangThai: 'CheckedOut' }).select('_id MaPTP').lean();
    const dichVuIDs = await DichVu.find().select('_id MaDV').lean();

    const suDungDichVuData = [
        { MaSDDV: 'SDDV001', PhieuThuePhong: phieuThuePhongCheckedIn._id, DichVu: dichVuIDs.find(dv => dv.MaDV === 'DV01')._id, SoLuong: 2, DonGia: 20000, ThoiDiemYeuCau: new Date('2025-12-12'), ThanhTien: 40000, TrangThai: 'Completed' },
        { MaSDDV: 'SDDV002', PhieuThuePhong: phieuThuePhongCheckedIn._id, DichVu: dichVuIDs.find(dv => dv.MaDV === 'DV02')._id, SoLuong: 1, DonGia: 15000, ThoiDiemYeuCau: new Date('2025-12-20'), ThanhTien: 15000, TrangThai: 'In Progress' },
        { MaSDDV: 'SDDV003', PhieuThuePhong: phieuThuePhongCheckedOut._id, DichVu: dichVuIDs.find(dv => dv.MaDV === 'DV01')._id, SoLuong: 1, DonGia: 20000, ThoiDiemYeuCau: new Date('2024-08-05'), ThanhTien: 20000, TrangThai: 'Cancelled' },
        { MaSDDV: 'SDDV004', PhieuThuePhong: phieuThuePhongCheckedOut._id, DichVu: dichVuIDs.find(dv => dv.MaDV === 'DV03')._id, SoLuong: 1, DonGia: 50000, ThoiDiemYeuCau: new Date('2024-08-07'), ThanhTien: 50000, TrangThai: 'Completed' }
    ];

    await SuDungDichVu.insertMany(suDungDichVuData);
    console.log('=> Seeded SuDungDichVu data');
}

async function seedHoaDon() {
    console.log('=> Seeding HoaDon data...');
    const phieuThuePhongCheckedOut = await PhieuThuePhong.findOne({ TrangThai: 'CheckedOut' }).select('_id MaPTP DatPhong DonGiaSauDieuChinh NgayNhanPhong NgayTraDuKien').populate({ path: 'DatPhong', select: 'TienCoc' }).lean();
    const nvLeTanID = await NhanVien.findOne({ MaNV: 'NV003' }).select('_id').lean();
    const khachHangID = await KhachHang.findOne({ MaKH: 'KH005' }).select('_id').lean();
    const phuongThucTT = await PhuongThucThanhToan.findOne({ MaPTTT: 'PTTT01' }).select('_id').lean();
    const suDungDichVuRecords = await SuDungDichVu.find({ PhieuThuePhong: phieuThuePhongCheckedOut._id }).lean();
    const tienCocDatPhong = phieuThuePhongCheckedOut.DatPhong.TienCoc;
    const chiTietHoaDon = suDungDichVuRecords.map((sddv, index) => ({
        MaCTHD: `CTHD00${index + 1}`,
        SoLuong: sddv.SoLuong,
        DonGia: sddv.DonGia,
        ThanhTien: sddv.ThanhTien
    }));

    const tongTienDichVu = chiTietHoaDon.reduce((sum, item) => sum + item.ThanhTien, 0);
    const tongTienPhong = phieuThuePhongCheckedOut.DonGiaSauDieuChinh * ( (new Date(phieuThuePhongCheckedOut.NgayTraDuKien) - new Date(phieuThuePhongCheckedOut.NgayNhanPhong)) / (1000*60*60*24) );

    const hoaDonData = {
        MaHD: 'HD001',
        PhieuThuePhong: phieuThuePhongCheckedOut._id,
        NhanVienThuNgan: nvLeTanID._id,
        KhachHang: khachHangID._id,
        TongTienPhong: tongTienPhong,
        TongTienDichVu: tongTienDichVu,
        PhuThu: 0,
        TienBoiThuong: 0,
        TienDaCoc: tienCocDatPhong.TienCoc,
        TongThanhToan: tongTienPhong + tongTienDichVu - tienCocDatPhong,
        PhuongThucThanhToan: phuongThucTT._id,
        ChiTietHoaDon: chiTietHoaDon
    };

    await HoaDon.create(hoaDonData);
    console.log('=> Seeded HoaDon data');
}

async function seedLichSuDatPhong() {
    console.log('=> Seeding LichSuDatPhong data...');
    const datPhongIDs = await DatPhong.find().select('_id MaDatPhong TrangThai').lean();
    const taiKhoanIDs = await TaiKhoan.find({ VaiTro: 'Customer' }).select('_id TenDangNhap').lean();

    const lichSuDatPhongData = [
        { MaLSDP: 'LSDP001', DatPhong: datPhongIDs[0]._id, TrangThaiCu: 'Pending', TrangThaiMoi: 'Pending', ThoiGian: new Date('2025-12-01'), TaiKhoan: taiKhoanIDs[0]._id },
        { MaLSDP: 'LSDP002', DatPhong: datPhongIDs[1]._id, TrangThaiCu: 'Pending', TrangThaiMoi: 'CheckIn', ThoiGian: new Date('2025-12-01'), TaiKhoan: taiKhoanIDs[1]._id },
        { MaLSDP: 'LSDP003', DatPhong: datPhongIDs[2]._id, TrangThaiCu: 'Pending', TrangThaiMoi: 'Cancelled', ThoiGian: new Date('2025-12-03'), TaiKhoan: taiKhoanIDs[2]._id },
        { MaLSDP: 'LSDP004', DatPhong: datPhongIDs[3]._id, TrangThaiCu: 'Pending', TrangThaiMoi: 'NoShow', ThoiGian: new Date('2024-08-04'), TaiKhoan: null },
        { MaLSDP: 'LSDP005', DatPhong: datPhongIDs[4]._id, TrangThaiCu: 'CheckedIn', TrangThaiMoi: 'CheckedOut', ThoiGian: new Date('2024-08-10'), TaiKhoan: null }
    ];

    console.log('=> Seeded LichSuDatPhong data');
}

async function seedLichSuSuDungDichVu() {
    console.log('=> Seeding LichSuSuDungDichVu data...');
    const suDungDichVuIDs = await SuDungDichVu.find().select('_id MaSDDV TrangThai').lean();
    const taiKhoanKhach002 = await TaiKhoan.findOne({ TenDangNhap: 'customer2' }).select('_id').lean();

    const lichSuSuDungDichVuData = [
        { MaLSDV: 'LSDV001', SuDungDichVu: suDungDichVuIDs[0]._id, TrangThaiCu: 'Pending', TrangThaiMoi: 'Completed', ThoiGian: new Date('2025-12-13'), TaiKhoan: taiKhoanKhach002._id },
        { MaLSDV: 'LSDV002', SuDungDichVu: suDungDichVuIDs[1]._id, TrangThaiCu: 'Pending', TrangThaiMoi: 'In Progress', ThoiGian: new Date('2025-12-21'), TaiKhoan: taiKhoanKhach002._id },
        { MaLSDV: 'LSDV003', SuDungDichVu: suDungDichVuIDs[2]._id, TrangThaiCu: 'Pending', TrangThaiMoi: 'Cancelled', ThoiGian: new Date('2024-08-05'), TaiKhoan: null },
        { MaLSDV: 'LSDV004', SuDungDichVu: suDungDichVuIDs[3]._id, TrangThaiCu: 'Pending', TrangThaiMoi: 'Completed', ThoiGian: new Date('2024-08-08'), TaiKhoan: null }
    ];

    await LichSuSuDungDichVu.insertMany(lichSuSuDungDichVuData);
    console.log('=> Seeded LichSuSuDungDichVu data');
}

seed();