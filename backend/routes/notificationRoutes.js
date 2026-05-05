const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');


// Routes for guests
router.get('/', auth, notificationController.getNotificationsForGuest);
router.put('/:id/read', auth, notificationController.markAsRead);


module.exports = router;

