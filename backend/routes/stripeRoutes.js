const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');
const authMiddleware = require('../middleware/auth');

// Create checkout session (requires auth)
router.post('/create-checkout-session', authMiddleware, stripeController.createCheckoutSession);

// Verify payment after redirect (requires auth)
router.get('/verify-payment', authMiddleware, stripeController.verifyPayment);

// Cancel pending booking (requires auth)
router.get('/cancel-booking', authMiddleware, stripeController.cancelPendingBooking);

// Webhook endpoint (no auth - Stripe sends this directly)
// Note: Raw body needed for webhook signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), stripeController.handleWebhook);

module.exports = router;
