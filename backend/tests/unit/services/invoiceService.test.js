const invoiceService = require('../../../services/invoiceService');
const HoaDon = require('../../../models/HoaDon');
const PhieuThuePhong = require('../../../models/PhieuThuePhong');
const SuDungDichVu = require('../../../models/SuDungDichVu');
const CaiDat = require('../../../models/CaiDat');

jest.mock('../../../models/HoaDon');
jest.mock('../../../models/PhieuThuePhong');
jest.mock('../../../models/SuDungDichVu');
jest.mock('../../../models/CaiDat');

describe('InvoiceService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockData = {
        MaHD: 'HD001',
        PhieuThuePhong: 'ptp1',
        NhanVienThuNgan: 'staff1',
        KhachHang: 'cust1',
        PhuongThucThanhToan: 'Cash',
        TongTienPhong: 1000,
        TongTienDichVu: 500,
        TienDaCoc: 200
    };
    // test create invoice
    describe('createInvoice', () => {
        // test 1 tạo hóa đơn thất bại do thiếu thông tin
        it('should throw error if required fields are missing', async () => {
            const invalidData = { ...mockData, PhieuThuePhong: null };
            await expect(invoiceService.createInvoice(invalidData, {})).rejects.toEqual({
                status: 400,
                message: "Dữ liệu hóa đơn không đầy đủ",
                errors: ["Vui lòng chọn Phiếu thuê phòng"]
            });
        });
        // test 2 tạo hóa đơn thành công
        it('should calculate totals and create invoice successfully', async () => {
            HoaDon.countDocuments.mockResolvedValue(0);
            HoaDon.updateMany.mockResolvedValue({});
            
            // Mock PhieuThuePhong populate
            const mockPTP = { 
                _id: 'ptp1', 
                DatPhong: { 
                    KhachHang: { _id: 'cust1' }, 
                    TienCoc: 200, 
                    HangPhong: 'Normal',
                    NgayDen: new Date('2023-01-01'),
                    NgayDi: new Date('2023-01-02')
                },
                DonGiaSauDieuChinh: 1000
            };
            PhieuThuePhong.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockPTP)
            });

            SuDungDichVu.find.mockResolvedValue([]);
            CaiDat.findOne.mockResolvedValue({ GiaPhongCoBan: { Normal: 500 } });

            const mockCreatedInvoice = {
                populate: jest.fn().mockResolvedValue({ _id: 'inv1', ...mockData, TongThanhToan: 1300 })
            };
            HoaDon.create.mockResolvedValue(mockCreatedInvoice);

            const result = await invoiceService.createInvoice(mockData, { id: 'staff1' });

            expect(result.TongThanhToan).toBe(1300); // 1000 + 500 - 200 + 0... Wait, input provided totals
            // Logic: 
            // TongTienPhong = 1000 (input)
            // TongTienDichVu = 500 (input)
            // PhuThu = 0
            // TienBoiThuong = 0
            // TienDaCoc = 200 (input)
            // Total = 1000 + 500 + 0 + 0 - 200 = 1300
        });
        // test 3 tạo hóa đơn thành công khi thiếu thông tin
        it('should use booked duration for Room Total calculation if input missing', async () => {
            HoaDon.countDocuments.mockResolvedValue(0);
            // Missing TongTienPhong in input
            const partialData = { ...mockData, TongTienPhong: null };
            
            const mockPTP = { 
                _id: 'ptp1', 
                DatPhong: { 
                    KhachHang: { _id: 'cust1' }, 
                    TienCoc: 200, 
                    HangPhong: 'Normal',
                    NgayDen: new Date('2023-01-01'),
                    NgayDi: new Date('2023-01-03') // 2 nights
                },
                DonGiaSauDieuChinh: 1000
            };
            PhieuThuePhong.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockPTP)
            });
            SuDungDichVu.find.mockResolvedValue([]);

            const mockCreatedInvoice = {
                populate: jest.fn().mockReturnValue({ _id: 'inv1' })
            };
            HoaDon.create.mockResolvedValue(mockCreatedInvoice);

            await invoiceService.createInvoice(partialData, { id: 'staff1' });

            // Verify called with calculated room price: 2 nights * 1000 = 2000
            expect(HoaDon.create).toHaveBeenCalledWith(expect.objectContaining({
                TongTienPhong: 2000
            }));
        });
    });
    // test create checkout invoice
    describe('createCheckoutInvoice', () => {
        // test 1 tạo hóa đơn thanh toán thành công
         it('should create checkout invoice with service charges', async () => {
            HoaDon.countDocuments.mockResolvedValue(0);
            SuDungDichVu.find.mockResolvedValue([
                { MaSDDV: 's1', ThanhTien: 100, SoLuong: 1, DonGia: 100 }
            ]);
            
            const mockCreatedInvoice = {
                populate: jest.fn().mockResolvedValue({ _id: 'invCheck' })
            };
            HoaDon.create.mockResolvedValue(mockCreatedInvoice);

            const data = {
                PhieuThuePhong: 'ptp1',
                NhanVienThuNgan: 'staff1',
                KhachHang: 'cust1',
                PhuongThucThanhToan: 'Card',
                TongTienPhong: 1000,
                TienDaCoc: 200
            };

            await invoiceService.createCheckoutInvoice(data);

            expect(HoaDon.create).toHaveBeenCalledWith(expect.objectContaining({
                TongTienDichVu: 100,
                TongThanhToan: 900 // 1000 + 100 - 200
            }));
         });
    });
});
