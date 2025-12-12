const express = require('express');
const Service = require('../models/Service');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try { const s = await Service.create(req.body); res.json(s); } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try { const list = await Service.find(); res.json(list); } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try { const s = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(s); } catch (err) { next(err); }
});

module.exports = router;
