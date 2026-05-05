const mongoose = require('mongoose');

const CaiDatSchema = new mongoose.Schema({
  Key: { type: String, default: "GeneralSettings", unique: true },
  
  ThongTinKhachSan: {
    Ten: { type: String, default: "" },
    DiaChi: { type: String, default: "" },
    SDT: { type: String, default: "" },
    Email: { type: String, default: "" }
  },
  
  ThoiGian: {
    GioNhanPhong: { type: String, default: "14:00" },
    GioTraPhong: { type: String, default: "12:00" }
  },

  ThuePhi: {
    ThueVAT: { type: Number, default: 10 },
    PhiDichVu: { type: Number, default: 5 }
  },

  GiaPhongCoBan: {
    Normal: { type: Number, default: 400000 },
    Standard: { type: Number, default: 600000 },
    Premium: { type: Number, default: 900000 },
    Luxury: { type: Number, default: 1500000 }
  }
}, { timestamps: true });

module.exports = mongoose.model('CaiDat', CaiDatSchema);
