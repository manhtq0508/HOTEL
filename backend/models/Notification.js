const mongoose = require('mongoose');


const NotificationSchema = new mongoose.Schema({
    KhachHang: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KhachHang',
        required: true
    },
    TieuDe: { type: String, required: true },
    NoiDung: { type: String, required: true },
    Loai: {
        type: String,
        enum: ['Booking', 'Service', 'Maintenance', 'Promotion', 'General'],
        default: 'General'
    },
    DaDoc: { type: Boolean, default: false },
    NgayTao: { type: Date, default: Date.now }
}, { timestamps: true });


module.exports = mongoose.model('Notification', NotificationSchema);

