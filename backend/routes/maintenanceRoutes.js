const express = require('express');
const maintenanceController = require('../controllers/maintenanceController');
const auth = require('../middleware/auth');


const router = express.Router();


// Staff routes
router.get('/next-code', maintenanceController.getNextMaPBTCode);
router.post('/', maintenanceController.createMaintenanceRecord);
router.get('/', maintenanceController.getAllMaintenanceRecords);
router.get('/:id', maintenanceController.getMaintenanceRecordById);
router.put('/:id', maintenanceController.updateMaintenanceRecord);
router.delete('/:id', maintenanceController.deleteMaintenanceRecord);


// Guest routes
router.get('/guest/requests', auth, maintenanceController.getMaintenanceRequestsForGuest);
router.post('/guest/request', auth, maintenanceController.createMaintenanceRequest);


module.exports = router;



