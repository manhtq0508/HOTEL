const express = require('express');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// create booking
router.post('/', bookingController.create);
router.post('/walk-in', bookingController.createWalkIn);

// cancel booking
router.post('/:id/cancel', bookingController.cancel);

// basic queries
router.get('/', bookingController.getAll);
router.get('/:id', bookingController.getById);
router.put('/:id', bookingController.update);
router.delete('/:id', bookingController.delete);

module.exports = router;
