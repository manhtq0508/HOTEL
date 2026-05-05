const invoiceController = require('../../../controllers/invoiceController');
const invoiceService = require('../../../services/invoiceService');
const httpMocks = require('node-mocks-http');

jest.mock('../../../services/invoiceService');

describe('InvoiceController', () => {
    let req, res, next;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
        jest.clearAllMocks();
    });
    // test create invoice
    describe('create', () => {
        // test 1 tạo hóa đơn thành công
        it('should return result on success', async () => {
            invoiceService.createInvoice.mockResolvedValue({ _id: 'inv1' });
            req.body = { some: 'data' };
            await invoiceController.create(req, res, next);
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ _id: 'inv1' });
        });
        // test 2 tạo hóa đơn thất bại
        it('should return error status on service error', async () => {
            invoiceService.createInvoice.mockRejectedValue({ status: 400, message: 'Err', errors: ['detail'] });
            await invoiceController.create(req, res, next);
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData()).toEqual({ success: false, message: 'Err', errors: ['detail'] });
        });
    });
    // test create checkout invoice
    describe('createCheckoutInvoice', () => {
        it('should return result on success', async () => {
             invoiceService.createCheckoutInvoice.mockResolvedValue({ _id: 'invCheck' });
             await invoiceController.createCheckoutInvoice(req, res, next);
             expect(res.statusCode).toBe(201);
             expect(res._getJSONData().success).toBe(true);
        });
        // test 2 tạo hóa đơn thanh toán thất bại
        it('should return error status on service error', async () => {
             invoiceService.createCheckoutInvoice.mockRejectedValue({ status: 400, message: 'Err' });
             await invoiceController.createCheckoutInvoice(req, res, next);
             expect(res.statusCode).toBe(400);
             expect(res._getJSONData()).toEqual({ message: 'Err' });
        });
    });
});
