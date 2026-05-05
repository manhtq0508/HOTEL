const mongoose = require('mongoose');

const TaiKhoanSchema = new mongoose.Schema({
    TenDangNhap: { type: String, required: true, unique: true },
    MatKhau: { type: String, required: true },
    VaiTro: { 
        type: String,
        enum: ["Admin", "Manager", "Receptionist", "MaintenanceStaff", "Customer"], 
        required: true 
    },
    resetOTP: String,
    resetOTPExpires: Date
}, { timestamps: true });

module.exports = mongoose.model('TaiKhoan', TaiKhoanSchema);