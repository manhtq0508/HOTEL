const authService = require('../../../services/authService');
const TaiKhoan = require('../../../models/TaiKhoan');
const KhachHang = require('../../../models/KhachHang');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock Mongoose models
jest.mock('../../../models/TaiKhoan');
jest.mock('../../../models/KhachHang');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// xóa trạng thái mock cũ, tránh bị ảnh hưởng test trước
describe('AuthService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

// test register
  describe('register', () => {
    it('should throw error if password is too short', async () => {
       await expect(authService.register({ TenDangNhap: 'test', MatKhau: '12345', VaiTro: 'Admin' })).rejects.toEqual({
         status: 400,
         message: 'Mật khẩu phải có ít nhất 6 ký tự'
       });
    });

    it('should throw error if required fields are missing', async () => {
      // test 1: Thiếu dữ liệu
      await expect(authService.register({})).rejects.toEqual({
        status: 400,
        message: 'TenDangNhap, MatKhau, and VaiTro are required'
      });

      // test 2: Thiếu TenDangNhap
      await expect(authService.register({ MatKhau: '123', VaiTro: 'Admin' })).rejects.toEqual({
        status: 400,
        message: 'TenDangNhap, MatKhau, and VaiTro are required'
      });

      // test 3: Thiếu MatKhau
      await expect(authService.register({ TenDangNhap: 'test', VaiTro: 'Admin' })).rejects.toEqual({
        status: 400,
        message: 'TenDangNhap, MatKhau, and VaiTro are required'
      });

      // test 4: Thiếu VaiTro
      await expect(authService.register({ TenDangNhap: 'test', MatKhau: '123' })).rejects.toEqual({
        status: 400,
        message: 'TenDangNhap, MatKhau, and VaiTro are required'
      });
    });

    it('should throw error if account already exists', async () => {
      // test 2: Tài khoản tồn tại
      TaiKhoan.findOne.mockResolvedValue({ _id: 'existing' });
      const data = { TenDangNhap: 'test', MatKhau: '123456', VaiTro: 'Admin' };

      await expect(authService.register(data)).rejects.toEqual({
          status: 409, 
          message: 'Account already exists'
      });
    });

    it('should create new account successfully', async () => {
      // test 3: Tạo tài khoản mới
      TaiKhoan.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPass');
      TaiKhoan.create.mockResolvedValue({
        _id: 'newId',
        TenDangNhap: 'test',
        VaiTro: 'Admin',
        toObject: () => ({ _id: 'newId', TenDangNhap: 'test', VaiTro: 'Admin' })
      });

      const data = { TenDangNhap: 'test', MatKhau: '123456', VaiTro: 'Admin' };
      const result = await authService.register(data);

      expect(result).toEqual({
        id: 'newId',
        TenDangNhap: 'test',
        VaiTro: 'Admin'
      });
    });

    it('should link to existing customer if role is Customer', async () => {
      // test 4: Tạo tài khoản mới và liên kết với khách hàng
      TaiKhoan.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPass');
      const mockTaiKhoan = { _id: 'tkId', TenDangNhap: 'cust', VaiTro: 'Customer' };
      TaiKhoan.create.mockResolvedValue(mockTaiKhoan);
      
      const mockKhachHang = { 
          Email: 'cust@mail.com', 
          save: jest.fn() 
      };
      KhachHang.findOne.mockResolvedValue(mockKhachHang);

      const data = { 
          TenDangNhap: 'cust', 
          MatKhau: '123456', 
          VaiTro: 'Customer',
          Email: 'cust@mail.com'
      };

      await authService.register(data);

      expect(KhachHang.findOne).toHaveBeenCalledWith({ Email: 'cust@mail.com' });
      expect(mockKhachHang.TaiKhoan).toBe('tkId');
      expect(mockKhachHang.save).toHaveBeenCalled();
    });
  });

  // test login
  describe('login', () => {
    // test 1: Thiếu dữ liệu
    it('should throw error if fields missing', async () => {
       await expect(authService.login({})).rejects.toEqual({
           status: 400,
           message: "TenDangNhap and MatKhau are required"
       });
    });

    it('should throw error if user not found', async () => {
      // test 2: Tài khoản không tồn tại
      TaiKhoan.findOne.mockResolvedValue(null);
      await expect(authService.login({ TenDangNhap: 'u', MatKhau: 'p'})).rejects.toEqual({
          status: 401,
          message: "Invalid credentials"
      });
    });

    it('should throw error if password invalid', async () => {
      // test 3: Mật khẩu không chính xác
      TaiKhoan.findOne.mockResolvedValue({ MatKhau: 'hash' });
      bcrypt.compare.mockResolvedValue(false);
      
      await expect(authService.login({ TenDangNhap: 'u', MatKhau: 'p'})).rejects.toEqual({
          status: 401,
          message: "Invalid credentials"
      });
    });
  
    it('should return token on success', async () => {
      // test 4: Đăng nhập thành công
      TaiKhoan.findOne.mockResolvedValue({ 
          _id: 'uid', 
          MatKhau: 'hash', 
          VaiTro: 'Admin', 
          TenDangNhap: 'u' 
      });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token123');

      const result = await authService.login({ TenDangNhap: 'u', MatKhau: 'p'});
      
      expect(result).toEqual({ token: 'token123', VaiTro: 'Admin' });
    });
  });
});
