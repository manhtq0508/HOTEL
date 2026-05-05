const bookingController = require('../../../controllers/bookingController');
const bookingService = require('../../../services/bookingService');
const httpMocks = require('node-mocks-http');

jest.mock('../../../services/bookingService');
describe('BookingController', () => {
    let req, res, next;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
        jest.clearAllMocks();
    });
    // Test create
    describe('create', () => {
        // test 1 tạo booking thành công
        it('should return json result on success', async () => {
            const mockResult = { _id: 'dp1' };
            bookingService.createBooking.mockResolvedValue(mockResult);
            
            req.body = { some: 'data' };
            await bookingController.create(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual(mockResult);
        });

        // test 2 tạo booking thất bại
        it('should return error status and message on service error', async () => {
            bookingService.createBooking.mockRejectedValue({ status: 400, message: 'Bad request' });
            
            await bookingController.create(req, res, next);

            expect(res.statusCode).toBe(400);
            expect(res._getJSONData()).toEqual({ message: 'Bad request' });
        });

        // test 3 tạo booking thất bại do lỗi không mong muốn
        it('should call next on unexpected error', async () => {
            const err = new Error('Crash');
            bookingService.createBooking.mockRejectedValue(err);
            
            await bookingController.create(req, res, next);

            expect(next).toHaveBeenCalledWith(err);
        });
    });
    // test createWalkIn (Admin)
    describe('createWalkIn', () => {
        // test 1 tạo booking thành công
        it('should return json result on success', async () => {
            const mockResult = { _id: 'dpWalkIn' };
            bookingService.createWalkIn.mockResolvedValue(mockResult);

            req.body = { some: 'data' };
            await bookingController.createWalkIn(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual(mockResult);
        });

        // test 2 tạo booking thất bại
        it('should return error status on service error', async () => {
             bookingService.createWalkIn.mockRejectedValue({ status: 400, message: 'Invalid' });

             await bookingController.createWalkIn(req, res, next);

             expect(res.statusCode).toBe(400);
             expect(res._getJSONData()).toEqual({ message: 'Invalid' });
        });
    });
});
