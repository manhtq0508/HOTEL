const express = require('express');
const positionController = require('../controllers/positionController');

const router = express.Router();

router.post('/', positionController.createPosition);
router.get('/', positionController.getAllPositions);
router.get('/:id', positionController.getPositionById);
router.put('/:id', positionController.updatePosition);
router.delete('/:id', positionController.deletePosition);

module.exports = router;
