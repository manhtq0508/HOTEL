const Phong = require('../models/Phong');
const LoaiPhong = require('../models/LoaiPhong');
const DatPhong = require('../models/DatPhong');
const eventBus = require('../events/eventBus');

/**
 * Tìm phòng trống theo hạng và khoảng thời gian.
 * @param {string} hangPhong - Tên loại phòng (Normal, Standard, Premium, Luxury)
 * @param {Date}   startDate
 * @param {Date}   endDate
 * @param {string} [excludeBookingId] - Bỏ qua booking hiện tại khi update
 */
exports.findAvailableRoom = async (hangPhong, startDate, endDate, excludeBookingId = null) => {
    const loaiPhong = await LoaiPhong.findOne({ TenLoaiPhong: hangPhong });
    if (!loaiPhong) return null;

    const rooms = await Phong.find({ LoaiPhong: loaiPhong._id });
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    for (const room of rooms) {
        if (room.TrangThai === 'Maintenance') continue;
        if (start <= now && ['Occupied', 'Cleaning'].includes(room.TrangThai)) continue;

        const query = {
            "ChiTietDatPhong.Phong": room._id,
            TrangThai: { $nin: ['Cancelled', 'CheckedOut', 'NoShow', 'Pending'] },
            $or: [{ NgayDen: { $lt: end }, NgayDi: { $gt: start } }],
        };
        if (excludeBookingId) query._id = { $ne: excludeBookingId };

        const overlapping = await DatPhong.findOne(query);
        if (!overlapping) return room;
    }
    return null;
};

/**
 * Cập nhật trạng thái nhiều phòng.
 */
exports.updateRoomStatus = async (roomIds, trangThai) => {
    if (!roomIds || roomIds.length === 0) return;
    await Phong.updateMany({ _id: { $in: roomIds } }, { TrangThai: trangThai });
};

exports.registerEventListeners = () => {
    
    const { EVENTS } = eventBus;

    eventBus.on(EVENTS.BOOKING_CHECKED_IN, async ({ roomIds }) => {
        try { await exports.updateRoomStatus(roomIds, 'Occupied'); }
        catch (e) { console.error('[roomService] CHECKED_IN handler error:', e); }
    });

    eventBus.on(EVENTS.BOOKING_CHECKED_OUT, async ({ roomIds }) => {
        try { await exports.updateRoomStatus(roomIds, 'Available'); }
        catch (e) { console.error('[roomService] CHECKED_OUT handler error:', e); }
    });

    eventBus.on(EVENTS.BOOKING_CANCELLED, async ({ roomIds }) => {
        try { await exports.updateRoomStatus(roomIds, 'Available'); }
        catch (e) { console.error('[roomService] CANCELLED handler error:', e); }
    });
};


