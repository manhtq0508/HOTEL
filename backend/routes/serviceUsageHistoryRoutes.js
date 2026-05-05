const express = require('express');
const serviceUsageHistoryController = require('../controllers/serviceUsageHistoryController');

const router = express.Router();

router.post('/', serviceUsageHistoryController.createServiceUsageHistory);
router.get('/', serviceUsageHistoryController.getAllServiceUsageHistory);
router.get('/:id', serviceUsageHistoryController.getServiceUsageHistoryById);
router.get('/usage/:serviceUsageId', serviceUsageHistoryController.getHistoryByServiceUsageId);
router.put('/:id', serviceUsageHistoryController.updateServiceUsageHistory);
router.delete('/:id', serviceUsageHistoryController.deleteServiceUsageHistory);

module.exports = router;
