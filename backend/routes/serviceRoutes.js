const express = require('express');
const serviceController = require('../controllers/serviceController');

const router = express.Router();

router.post('/', serviceController.create);
router.get('/', serviceController.getAll);
router.get('/code/:MaDV', serviceController.getByMaDV);
router.get('/:id', serviceController.getById);
router.put('/:id', serviceController.update);
router.delete('/:id', serviceController.delete);

module.exports = router;
