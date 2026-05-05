const bookingService = require('../../../services/bookingService');
const DatPhong = require('../../../models/DatPhong');
const Phong = require('../../../models/Phong');
const LoaiPhong = require('../../../models/LoaiPhong');
const KhachHang = require('../../../models/KhachHang');

jest.mock('../../../models/DatPhong');
jest.mock('../../../models/Phong');
jest.mock('../../../models/LoaiPhong');
jest.mock('../../../models/KhachHang');

describe('BookingService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // test findAvailableRoom
    describe('findAvailableRoom', () => {
        // test 1 tìm phòng không tìm thấy loại phòng
        it('should return null if room type not found', async () => {
            LoaiPhong.findOne.mockResolvedValue(null);
            
            const result = await bookingService.findAvailableRoom('Deluxe', '2023-01-01', '2023-01-02');
            expect(result).toBeNull();
        });
        // test 2 tìm phòng không tìm thấy phòng 
        it('should return null if no rooms found', async () => {
            LoaiPhong.findOne.mockResolvedValue({ _id: 'typeId' });
            Phong.find.mockResolvedValue([]);

            const result = await bookingService.findAvailableRoom('Deluxe', '2023-01-01', '2023-01-02');
            expect(result).toBeNull();
        });

        // test 3 tìm phòng có phòng trống
        it('should return room if available (no overlap)', async () => {
            LoaiPhong.findOne.mockResolvedValue({ _id: 'typeId' });
            Phong.find.mockResolvedValue([{ _id: 'r1' }]);
            DatPhong.findOne.mockResolvedValue(null); // No overlap

            const result = await bookingService.findAvailableRoom('Deluxe', '2023-01-01', '2023-01-02');
            expect(result).toEqual({ _id: 'r1' });
        });

        // test 4 tìm phòng có phòng trống
        it('should skip room if overlapping', async () => {
            LoaiPhong.findOne.mockResolvedValue({ _id: 'typeId' });
            Phong.find.mockResolvedValue([{ _id: 'r1' }, { _id: 'r2' }]);
            DatPhong.findOne
                .mockResolvedValueOnce({ _id: 'existingBooking' }) // r1 overlaps
                .mockResolvedValueOnce(null); // r2 free

            const result = await bookingService.findAvailableRoom('Deluxe', '2023-01-01', '2023-01-02');
            expect(result).toEqual({ _id: 'r2' });
        });
    });

    // test createBooking
    describe('createBooking', () => {
        const mockData = {
            MaDatPhong: 'DP001',
            KhachHang: 'cust1',
            HangPhong: 'Deluxe',
            NgayDen: '2023-01-01',
            NgayDi: '2023-01-02',
            SoKhach: 2
        };
        // test 1 tạo booking không có thông tin, thiếu dữ liệu bắt buộc
        it('should throw error if fields missing', async () => {
            await expect(bookingService.createBooking({})).rejects.toEqual({
                status: 400,
                message: 'Missing required fields'
            });
        });
        // test 2 tạo booking không có thông tin, ngày đến lớn hơn ngày đi
        it('should throw error if start >= end date', async () => {
            const data = { ...mockData, NgayDen: '2023-01-02', NgayDi: '2023-01-01' };
            await expect(bookingService.createBooking(data)).rejects.toEqual({
                status: 400,
                message: 'Invalid dates'
            });
        });

        // test 3 tạo booking không có thông tin, tự động gán phòng khi chưa chọn phòng
        it('should auto-assign an available room when room is not provided', async () => {
            LoaiPhong.findOne.mockResolvedValue({ _id: 'typeId' });
            Phong.find.mockResolvedValue([{ _id: 'r1' }]);
            DatPhong.findOne.mockResolvedValue(null); // available
            
            DatPhong.create.mockResolvedValue({ _id: 'dp1', ...mockData, ChiTietDatPhong: [{ Phong: 'r1' }] });

            const result = await bookingService.createBooking(mockData);
            
            expect(result.ChiTietDatPhong[0].Phong).toBe('r1');
            expect(DatPhong.create).toHaveBeenCalled();
        });
        // test 4 tạo booking không có thông tin, không có phòng trống
        it('should throw error when no available room can be auto-assigned', async () => {
            LoaiPhong.findOne.mockResolvedValue({ _id: 'typeId' });
            Phong.find.mockResolvedValue([{ _id: 'r1' }]);
            DatPhong.findOne.mockResolvedValue({ _id: 'overlap' }); // overlap
            
            await expect(bookingService.createBooking(mockData)).rejects.toEqual({
                status: 400,
                message: expect.stringMatching(/Không còn phòng trống/)
            });
        });
    });

    describe('createWalkIn', () => {
        const mockWalkInData = {
            MaDatPhong: 'DP001',
            HangPhong: 'Deluxe',
            NgayDen: '2023-01-01',
            NgayDi: '2023-01-02',
            SoKhach: 2,
            HoTen: 'Guest',
            CMND: '123456789',
            SDT: '0987654321',
            Email: 'guest@example.com'
        };

        it('should throw error if required fields are missing', async () => {
            await expect(bookingService.createWalkIn({})).rejects.toEqual({
                status: 400,
                message: 'Missing required fields'
            });
        });

        it('should create new customer if not found', async () => {
            KhachHang.findOne.mockResolvedValue(null);
            const mockCustomer = { _id: 'custNew', HoTen: 'Guest' };
            KhachHang.create.mockResolvedValue(mockCustomer);

            LoaiPhong.findOne.mockResolvedValue({ _id: 'typeId' });
            Phong.find.mockResolvedValue([{ _id: 'r1' }]);
            DatPhong.findOne.mockResolvedValue(null);

            DatPhong.create.mockResolvedValue({ _id: 'dp1', ...mockWalkInData, ChiTietDatPhong: [{ Phong: 'r1' }], KhachHang: 'custNew' });

            const result = await bookingService.createWalkIn(mockWalkInData);

            expect(KhachHang.create).toHaveBeenCalled();
            expect(result.KhachHang).toBe('custNew');
        });

        it('should use existing customer if found', async () => {
            const mockCustomer = { _id: 'custExist', HoTen: 'Guest' };
            KhachHang.findOne.mockResolvedValue(mockCustomer);

            LoaiPhong.findOne.mockResolvedValue({ _id: 'typeId' });
            Phong.find.mockResolvedValue([{ _id: 'r1' }]);
            DatPhong.findOne.mockResolvedValue(null);

            DatPhong.create.mockResolvedValue({ _id: 'dp1', ...mockWalkInData, ChiTietDatPhong: [{ Phong: 'r1' }], KhachHang: 'custExist' });

            const result = await bookingService.createWalkIn(mockWalkInData);

            expect(KhachHang.create).not.toHaveBeenCalled();
            expect(result.KhachHang).toBe('custExist');
        });

        it('should throw error if no room available', async () => {
             KhachHang.findOne.mockResolvedValue({ _id: 'custExist' });
             LoaiPhong.findOne.mockResolvedValue({ _id: 'typeId' });
             Phong.find.mockResolvedValue([{ _id: 'r1' }]);
             DatPhong.findOne.mockResolvedValue({ _id: 'overlap' });

             await expect(bookingService.createWalkIn(mockWalkInData)).rejects.toEqual({
                status: 400,
                message: expect.stringMatching(/Không còn phòng trống/)
            });
        });
    });
});
