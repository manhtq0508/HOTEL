const DichVu = require('../models/DichVu');

exports.create = async (req, res, next) => {
  try {
    const { MaDV, TenDV, DonGia } = req.body;

    if (!MaDV || !TenDV) {
      return res.status(400).json({ message: 'MaDV and TenDV are required' });
    }

    const dichVu = await DichVu.create({
      MaDV,
      TenDV,
      DonGia: DonGia || 0
    });

    res.json(dichVu);
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const list = await DichVu.find();
    res.json(list);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const dichVu = await DichVu.findById(req.params.id);
    if (!dichVu) return res.status(404).json({ message: 'Service not found' });
    res.json(dichVu);
  } catch (err) { next(err); }
};

exports.getByMaDV = async (req, res, next) => {
  try {
    const dichVu = await DichVu.findOne({ MaDV: req.params.MaDV });
    if (!dichVu) return res.status(404).json({ message: 'Service not found' });
    res.json(dichVu);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const dichVu = await DichVu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dichVu) return res.status(404).json({ message: 'Service not found' });
    res.json(dichVu);
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const dichVu = await DichVu.findByIdAndDelete(req.params.id);
    if (!dichVu) return res.status(404).json({ message: 'Service not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
