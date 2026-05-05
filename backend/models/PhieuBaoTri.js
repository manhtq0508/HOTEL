const mongoose = require("mongoose");


const PhieuBaoTriSchema = new mongoose.Schema({
    MaPBT: { type: String, required: true, unique: true },
    Phong: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Phong',
        required: true
    },
    KhachHang: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KhachHang',
        required: true
    },
    NVKyThuat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NhanVien'
    },
    NoiDung: { type: String, required: true },
    NgayThucHien: { type: Date, default: Date.now },
    NgayKetThuc: { type: Date, default: Date.now },
    TrangThai: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PhieuBaoTri", PhieuBaoTriSchema);
