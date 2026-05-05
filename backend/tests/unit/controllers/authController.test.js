const authController = require('../../../controllers/authController');
const authService = require('../../../services/authService');
const httpMocks = require('node-mocks-http');

jest.mock('../../../services/authService');

describe('AuthController', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });
  // test register
  describe('register', () => {
    // test 1: Đăng ký thành công
    it('should return 201 and data on success', async () => {
      const mockResult = { id: 'newId', TenDangNhap: 'test' };
      authService.register.mockResolvedValue(mockResult);
      
      req.body = { TenDangNhap: 'test' };
      await authController.register(req, res, next);

      expect(res.statusCode).toBe(201);
      expect(res._getJSONData()).toEqual(mockResult);
    });

    // test 2: Đăng ký thất bại, lỗi nghiệp vụ, service chủ động throw Controller không bị crash  
    it('should return error status if service throws status error', async () => {
      authService.register.mockRejectedValue({ status: 400, message: 'Bad request' });
      
      await authController.register(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData()).toEqual({ message: 'Bad request', details: undefined });
    });

    // test 3: Đăng ký thất bại, lỗi hệ thống bị crash ko có status  
    it('should call next(err) if unexpected error', async () => {
        const error = new Error('Unexpected');
        authService.register.mockRejectedValue(error);
        
        await authController.register(req, res, next);
  
        expect(next).toHaveBeenCalledWith(error);
    });
  });
    // test login
  describe('login', () => {
    // test 1: Đăng nhập thành công
      it('should return 200 and token on success', async () => {
          const mockResult = { token: 'abc', VaiTro: 'Admin' };
          authService.login.mockResolvedValue(mockResult);

          await authController.login(req, res, next);

          expect(res.statusCode).toBe(200);
          expect(res._getJSONData()).toEqual(mockResult);
      });

    // test 2: Đăng nhập thất bại
      it('should return 401 if service throws 401', async () => {
          authService.login.mockRejectedValue({ status: 401, message: 'Invalid' });

          await authController.login(req, res, next);

          expect(res.statusCode).toBe(401);
          expect(res._getJSONData()).toEqual({ message: 'Invalid' });
      });
  });
});
