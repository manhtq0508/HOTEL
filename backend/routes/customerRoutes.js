const express = require('express');
const Customer = require('../models/Customer');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try { const c = await Customer.create(req.body); res.json(c); } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try { const list = await Customer.find().limit(200); res.json(list); } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try { const c = await Customer.findById(req.params.id); res.json(c); } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try { const c = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(c); } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try { await Customer.findByIdAndDelete(req.params.id); res.json({ ok: true }); } catch (err) { next(err); }
});

module.exports = router;
