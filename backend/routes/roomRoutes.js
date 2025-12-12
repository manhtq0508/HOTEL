const express = require('express');
const Room = require('../models/Room');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try { const r = await Room.create(req.body); res.json(r); } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try { const list = await Room.find(); res.json(list); } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try { const r = await Room.findById(req.params.id); res.json(r); } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try { const r = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(r); } catch (err) { next(err); }
});

router.post('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const r = await Room.findByIdAndUpdate(req.params.id, { TinhTrang: status }, { new: true });
    res.json(r);
  } catch (err) { next(err); }
});

module.exports = router;
