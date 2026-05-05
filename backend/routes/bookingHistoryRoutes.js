const express = require('express');
const bookingHistoryController = require('../controllers/bookingHistoryController');

const router = express.Router();

router.post('/', bookingHistoryController.createBookingHistory);
router.get('/', bookingHistoryController.getAllBookingHistory);
router.get('/:id', bookingHistoryController.getBookingHistoryById);
router.get('/booking/:bookingId', bookingHistoryController.getHistoryByBookingId);
router.delete('/:id', bookingHistoryController.deleteBookingHistory);

module.exports = router;
