const express = require('express');
const roomController = require('../controllers/roomController');

const router = express.Router();

router.post('/', roomController.create);
router.get('/', roomController.getAll);
router.get('/code/:MaPhong', roomController.getByMaPhong);
router.get('/:id', roomController.getById);
router.put('/:id', roomController.update);
router.post('/:id/status', roomController.changeStatus);
router.delete('/:id', roomController.delete);

module.exports = router;
