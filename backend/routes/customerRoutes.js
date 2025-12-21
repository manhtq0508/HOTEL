const express = require('express');
const customerController = require('../controllers/customerController');

const router = express.Router();

router.post('/', customerController.create);
router.get('/', customerController.getAll);
router.get('/code/:MaKH', customerController.getByMaKH);
router.get('/:id', customerController.getById);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.delete);

module.exports = router;
