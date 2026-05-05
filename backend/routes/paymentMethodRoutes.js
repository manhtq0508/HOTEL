const express = require('express');
const paymentMethodController = require('../controllers/paymentMethodController');

const router = express.Router();

router.post('/', paymentMethodController.createPaymentMethod);
router.get('/', paymentMethodController.getAllPaymentMethods);
router.get('/:id', paymentMethodController.getPaymentMethodById);
router.put('/:id', paymentMethodController.updatePaymentMethod);
router.delete('/:id', paymentMethodController.deletePaymentMethod);

module.exports = router;
