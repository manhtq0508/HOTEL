const DichVu = require('../models/DichVu');

// Get all items/services
exports.getItems = async (req, res, next) => {
  try {
    const items = await DichVu.find();
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Create a new item/service
exports.createItem = async (req, res, next) => {
  try {
    const { MaDV, TenDV, DonGia } = req.body;
    
    if (!MaDV || !TenDV) {
      return res.status(400).json({ message: 'MaDV and TenDV are required' });
    }

    const newItem = new DichVu({
      MaDV,
      TenDV,
      DonGia: DonGia || 0
    });
    
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
};

// Get item by ID
exports.getItem = async (req, res, next) => {
  try {
    const item = await DichVu.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Update item
exports.updateItem = async (req, res, next) => {
  try {
    const item = await DichVu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Delete item
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await DichVu.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
