const CaiDat = require('../models/CaiDat');
const Phong = require('../models/Phong');
const LoaiPhong = require('../models/LoaiPhong');

// Get settings (or create default if not exists)
const getSettings = async (req, res) => {
  try {
    let settings = await CaiDat.findOne({ Key: "GeneralSettings" });
    if (!settings) {
      settings = await CaiDat.create({ Key: "GeneralSettings" });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update settings AND sync room prices in Phong collection
const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    // Prevent updating the Key
    delete updates.Key;
    
    // Use findOneAndUpdate with upsert
    const settings = await CaiDat.findOneAndUpdate(
      { Key: "GeneralSettings" },
      { $set: updates },
      { new: true, upsert: true }
    );

    // SYNC: Update all rooms in Phong collection with new prices
    if (updates.GiaPhongCoBan) {
      const prices = updates.GiaPhongCoBan;
      const typesToSync = ["Normal", "Standard", "Premium", "Luxury"];
      
      console.log('[Settings] Syncing room prices for:', typesToSync);

      const updatePromises = typesToSync.map(async (typeName) => {
        if (prices[typeName] !== undefined) {
          // Find the LoaiPhong ID for this type name
          const loaiPhongDoc = await LoaiPhong.findOne({ TenLoaiPhong: typeName });
          
          if (loaiPhongDoc) {
            console.log(`[Settings] Updating rooms of type ${typeName} (${loaiPhongDoc._id}) to price ${prices[typeName]}`);
            return Phong.updateMany(
              { LoaiPhong: loaiPhongDoc._id },
              { $set: { GiaPhong: prices[typeName] } }
            );
          } else {
             console.warn(`[Settings] Warning: LoaiPhong '${typeName}' not found in database.`);
          }
        }
      });

      await Promise.all(updatePromises);
      console.log('[Settings] Room prices sync completed.');
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('[Settings] Error updating:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
