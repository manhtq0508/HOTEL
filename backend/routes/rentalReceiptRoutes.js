const express = require('express');
const rentalReceiptController = require('../controllers/rentalReceiptController');

const router = express.Router();

router.post('/', rentalReceiptController.createRentalReceipt);
router.get('/', rentalReceiptController.getAllRentalReceipts);
router.get('/:id', rentalReceiptController.getRentalReceiptById);
router.put('/:id', rentalReceiptController.updateRentalReceipt);
router.post('/:id/checkout', rentalReceiptController.checkOut);
router.delete('/:id', rentalReceiptController.deleteRentalReceipt);

module.exports = router;
