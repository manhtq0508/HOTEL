const Notification = require('../models/Notification');


// Get notifications for a guest
exports.getNotificationsForGuest = async (req, res) => {
  try {
    const guestId = req.user.id; // Assuming auth middleware sets req.user
    const notifications = await Notification.find({ KhachHang: guestId })
      .sort({ NgayTao: -1 });
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông báo',
      error: error.message
    });
  }
};


// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const guestId = req.user.id;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, KhachHang: guestId },
      { DaDoc: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Thông báo không tồn tại'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu đã đọc',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông báo',
      error: error.message
    });
  }
};


// Create notification (internal use, e.g., from booking controller)
exports.createNotification = async (guestId, tieuDe, noiDung, loai = 'General') => {
  try {
    const notification = new Notification({
      KhachHang: guestId,
      TieuDe: tieuDe,
      NoiDung: noiDung,
      Loai: loai
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

