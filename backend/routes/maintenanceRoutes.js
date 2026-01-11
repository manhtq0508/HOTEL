const express = require('express');
const maintenanceController = require('../controllers/maintenanceController');

const router = express.Router();

router.get('/next-code', maintenanceController.getNextMaPBTCode);
router.post('/', maintenanceController.createMaintenanceRecord);
router.get('/', maintenanceController.getAllMaintenanceRecords);
router.get('/:id', maintenanceController.getMaintenanceRecordById);
router.put('/:id', maintenanceController.updateMaintenanceRecord);
router.delete('/:id', maintenanceController.deleteMaintenanceRecord);

module.exports = router;
