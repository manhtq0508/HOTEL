const express = require('express');
const roomTypeController = require('../controllers/roomTypeController');

const router = express.Router();

router.post('/', roomTypeController.createRoomType);
router.get('/', roomTypeController.getAllRoomTypes);
router.get('/:id', roomTypeController.getRoomTypeById);
router.put('/:id', roomTypeController.updateRoomType);
router.delete('/:id', roomTypeController.deleteRoomType);

module.exports = router;
