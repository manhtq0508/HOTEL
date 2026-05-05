const express = require('express');
const datPhongController = require('../controllers/datPhongController');

const router = express.Router();

router.post('/', datPhongController.createBooking);
router.get('/', datPhongController.getAllBookings);
router.get('/:id', datPhongController.getBookingById);
router.get('/customer/:customerId', datPhongController.getBookingsByCustomerId);
router.put('/:id', datPhongController.updateBooking);
router.post('/:id/cancel', datPhongController.cancelBooking);
router.delete('/:id', datPhongController.deleteBooking);

module.exports = router;
