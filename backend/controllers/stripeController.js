const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const DatPhong = require('../models/DatPhong');
const KhachHang = require('../models/KhachHang');
const Phong = require('../models/Phong');
const LoaiPhong = require('../models/LoaiPhong');

// Helper to find available room for category and dates
const findAvailableRoom = async (hangPhong, startDate, endDate) => {
  try {
    const loaiPhong = await LoaiPhong.findOne({ TenLoaiPhong: hangPhong });
    if (!loaiPhong) return null;

    const rooms = await Phong.find({ LoaiPhong: loaiPhong._id });
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    const now = new Date();
    for (const room of rooms) {
      if (room.TrangThai === 'Maintenance') continue;

      if (start <= now && ['Occupied', 'Cleaning'].includes(room.TrangThai)) {
        continue;
      }
      
      const overlapping = await DatPhong.findOne({
        "ChiTietDatPhong.Phong": room._id,
        TrangThai: { $nin: ["Cancelled", "CheckedOut", "NoShow", "Pending"] },
        $or: [
          { NgayDen: { $lt: end }, NgayDi: { $gt: start } }
        ]
      });
      
      if (!overlapping) return room;
    }
  } catch (error) {
    console.error("Error finding available room:", error);
  }
  return null;
};

// Create Checkout Session for booking deposit
exports.createCheckoutSession = async (req, res) => {
  try {
    const {
      HangPhong,
      NgayDen,
      NgayDi,
      SoKhach,
      TienCoc,
      ChiTietDatPhong,
    } = req.body;

    let customerId = req.body.KhachHang;

    // Use token to identify customer if role is 'Customer'
    if (req.user && req.user.VaiTro === 'Customer') {
      const kh = await KhachHang.findOne({ TaiKhoan: req.user.id });
      if (!kh) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin khách hàng cho tài khoản này",
        });
      }
      customerId = kh._id;
    }

    if (!customerId || !HangPhong || !NgayDen || !NgayDi || !SoKhach) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đủ thông tin đặt phòng",
      });
    }

    // Create booking with Pending status first
    const count = await DatPhong.countDocuments();
    const MaDatPhong = `DP${String(count + 1).padStart(3, "0")}`;

    let finalDetails = ChiTietDatPhong || [];
    
    // Auto-assign room if not provided
    if (finalDetails.length === 0) {
      const room = await findAvailableRoom(HangPhong, NgayDen, NgayDi);
      if (room) {
        finalDetails = [{
          MaCTDP: `CTDP${Date.now()}`,
          Phong: room._id
        }];
      } else {
        return res.status(400).json({
          success: false,
          message: `Không còn phòng trống cho hạng ${HangPhong} trong khoảng thời gian này`
        });
      }
    }

    const booking = new DatPhong({
      MaDatPhong,
      KhachHang: customerId,
      HangPhong,
      NgayDen,
      NgayDi,
      SoKhach,
      TienCoc: TienCoc || 0,
      ChiTietDatPhong: finalDetails,
      TrangThai: "Pending",
    });

    await booking.save();

    // Get customer info for Stripe
    const customer = await KhachHang.findById(customerId);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'vnd',
            product_data: {
              name: `Đặt cọc phòng ${HangPhong}`,
              description: `Phòng ${HangPhong} - Từ ${NgayDen} đến ${NgayDi}`,
            },
            unit_amount: TienCoc || 0, // VND doesn't need multiplication
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/booking/cancel?booking_id=${booking._id}`,
      customer_email: customer?.Email,
      metadata: {
        bookingId: booking._id.toString(),
        customerId: customerId.toString(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Tạo phiên thanh toán thành công",
      data: {
        sessionId: session.id,
        url: session.url,
        bookingId: booking._id,
      },
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo phiên thanh toán",
      error: error.message,
    });
  }
};

// Verify payment and update booking status
exports.verifyPayment = async (req, res) => {
  try {
    const { session_id, booking_id } = req.query;

    if (!session_id || !booking_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin xác thực",
      });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      // Update booking status to DepositPaid
      const booking = await DatPhong.findByIdAndUpdate(
        booking_id,
        { TrangThai: 'DepositPaid' },
        { new: true }
      )
        .populate("KhachHang", "HoTen SoDT Email")
        .populate("ChiTietDatPhong.Phong");

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đặt phòng",
        });
      }

      // Update room status to Reserved
      if (booking.ChiTietDatPhong && booking.ChiTietDatPhong.length > 0) {
        const roomIds = booking.ChiTietDatPhong.map(detail => 
          detail.Phong._id || detail.Phong
        );
        await Phong.updateMany(
          { _id: { $in: roomIds } },
          { TrangThai: 'Reserved' }
        );
      }

      res.status(200).json({
        success: true,
        message: "Thanh toán thành công",
        data: booking,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Thanh toán chưa hoàn tất",
        paymentStatus: session.payment_status,
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xác thực thanh toán",
      error: error.message,
    });
  }
};

// Cancel pending booking
exports.cancelPendingBooking = async (req, res) => {
  try {
    const { booking_id } = req.query;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin đặt phòng",
      });
    }

    const booking = await DatPhong.findById(booking_id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt phòng",
      });
    }

    // Only cancel if still pending
    if (booking.TrangThai === 'Pending') {
      booking.TrangThai = 'Cancelled';
      await booking.save();
    }

    res.status(200).json({
      success: true,
      message: "Đã hủy đặt phòng",
      data: booking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi hủy đặt phòng",
      error: error.message,
    });
  }
};

// Stripe Webhook (optional - for more reliable payment confirmation)
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    if (session.payment_status === 'paid' && session.metadata?.bookingId) {
      await DatPhong.findByIdAndUpdate(
        session.metadata.bookingId,
        { TrangThai: 'DepositPaid' }
      );
      console.log(`Booking ${session.metadata.bookingId} updated to DepositPaid via webhook`);
    }
  }

  res.json({ received: true });
};
