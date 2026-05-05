const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const TaiKhoan = require("../models/TaiKhoan");
const KhachHang = require("../models/KhachHang");

exports.register = async (data) => {
  const { TenDangNhap, MatKhau, VaiTro, HoTen, CMND, SDT, Email, DiaChi } = data;

  if (!TenDangNhap || !MatKhau || !VaiTro) {
    throw { status: 400, message: "TenDangNhap, MatKhau, and VaiTro are required" };
  }

  if (MatKhau.length < 6) {
    throw { status: 400, message: "Mật khẩu phải có ít nhất 6 ký tự" };
  }

  const existingAccount = await TaiKhoan.findOne({ TenDangNhap });
  if (existingAccount) {
    throw { status: 409, message: "Account already exists" };
  }

  const salt = await bcrypt.genSalt(10);
  const matKhauHash = await bcrypt.hash(MatKhau, salt);

  const taiKhoan = await TaiKhoan.create({
    TenDangNhap,
    MatKhau: matKhauHash,
    VaiTro,
  });

  // If Customer role, handle KhachHang linkage
  if (VaiTro === "Customer") {
    try {
      const lookupEmail = Email || TenDangNhap;
      // 1. Check if a KhachHang record already exists for this Email
      let existingKH = await KhachHang.findOne({ Email: lookupEmail });

      if (existingKH) {
        // If profile exists, link it to the new TaiKhoan
        existingKH.TaiKhoan = taiKhoan._id;
        // Optionally update other fields if provided
        if (HoTen) existingKH.HoTen = HoTen;
        if (CMND) existingKH.CMND = CMND;
        if (SDT) existingKH.SDT = SDT;
        if (DiaChi) existingKH.DiaChi = DiaChi;
        await existingKH.save();
      } else {
        // 2. If no profile exists, create a new one
        const lastCustomer = await KhachHang.findOne()
          .sort({ MaKH: -1 })
          .select("MaKH");

        let nextNumber = 1;
        if (lastCustomer && lastCustomer.MaKH) {
          const match = lastCustomer.MaKH.match(/KH(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }

        const makh = "KH" + String(nextNumber).padStart(3, "0");
        await KhachHang.create({
          MaKH: makh,
          TaiKhoan: taiKhoan._id,
          HoTen: HoTen || "Khách hàng mới",
          CMND: CMND || "CMND_" + Date.now(),
          SDT: SDT || "0000000000",
          Email: lookupEmail,
          DiaChi: DiaChi || ""
        });
      }
    } catch (customerError) {
      console.error("Error linking/creating customer record:", customerError);
      // Account exists, but profile link failed. We log it and continue.
    }
  }

  return {
    id: taiKhoan._id,
    TenDangNhap: taiKhoan.TenDangNhap,
    VaiTro: taiKhoan.VaiTro,
  };
};

exports.login = async (data) => {
  const { TenDangNhap, MatKhau } = data;

  if (!TenDangNhap || !MatKhau) {
    throw { status: 400, message: "TenDangNhap and MatKhau are required" };
  }

  const taiKhoan = await TaiKhoan.findOne({ TenDangNhap });
  if (!taiKhoan) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const isValid = await bcrypt.compare(MatKhau, taiKhoan.MatKhau);
  if (!isValid) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const token = jwt.sign(
    {
      id: taiKhoan._id,
      VaiTro: taiKhoan.VaiTro,
      TenDangNhap: taiKhoan.TenDangNhap,
    },
    process.env.JWT_SECRET || "secretkey",
    { expiresIn: "8h" }
  );

  return { token, VaiTro: taiKhoan.VaiTro };
};

exports.forgotPassword = async (data) => {
    const { Email } = data;

    if (!Email) {
      throw { status: 400, message: "Email is required" };
    }

    // Find customer by email
    const customer = await KhachHang.findOne({ Email });
    if (!customer || !customer.TaiKhoan) {
      throw { status: 404, message: "No account found with this email" };
    }

    const taiKhoan = await TaiKhoan.findById(customer.TaiKhoan);
    if (!taiKhoan) {
        throw { status: 404, message: "Account not found" };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    taiKhoan.resetOTP = otp;
    taiKhoan.resetOTPExpires = Date.now() + 600000; // 10 minutes
    await taiKhoan.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customer.Email,
      subject: "Mã xác thực đặt lại mật khẩu",
      text: `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 10 phút.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #333;">Đặt lại mật khẩu</h2>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>Hotel Management System</strong>.</p>
          <p>Mã xác thực (OTP) của bạn là:</p>
          <div style="font-size: 24px; font-weight: bold; color: #d90429; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>Mã này sẽ hết hạn sau <strong>10 phút</strong>.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
        </div>
      `,
    };

    // For development, if EMAIL_USER is not set, we just log the OTP
    if (!process.env.EMAIL_USER) {
      console.log("-----------------------------------------");
      console.log(`[DEV] OTP for ${customer.Email}: ${otp}`);
      console.log("-----------------------------------------");
      return { message: "Email simulation (check server console for OTP code)", otp };
    }

    try {
      await transporter.sendMail(mailOptions);
      return { message: "Email sent" };
    } catch (mailError) {
      console.error("Mail sending error:", mailError);
      throw {
        status: 500,
        message: "Lỗi cấu hình email SMTP (535). Vui lòng đảm bảo bạn đã nhập đúng 'Mật khẩu ứng dụng' trong file .env và đã bật xác minh 2 bước cho Gmail.",
        details: mailError.message
      }
    }
};

exports.resetPasswordWithOTP = async (data) => {
    const { Email, OTP, MatKhau: NewMatKhau } = data; // Rename MatKhau to NewMatKhau to avoid confusion if needed, though MatKhau works as key

    if (!Email || !OTP || !NewMatKhau) {
        throw { status: 400, message: "Email, OTP and New Password are required" };
    }

    if (NewMatKhau.length < 6) {
        throw { status: 400, message: "Mật khẩu mới phải có ít nhất 6 ký tự" };
    }

    const customer = await KhachHang.findOne({ Email });
    if (!customer || !customer.TaiKhoan) {
        throw { status: 404, message: "Account not found" };
    }

    const taiKhoan = await TaiKhoan.findOne({
      _id: customer.TaiKhoan,
      resetOTP: OTP,
      resetOTPExpires: { $gt: Date.now() },
    });

    if (!taiKhoan) {
      throw { status: 400, message: "Mã OTP không chính xác hoặc đã hết hạn" };
    }

    const salt = await bcrypt.genSalt(10);
    taiKhoan.MatKhau = await bcrypt.hash(NewMatKhau, salt);
    taiKhoan.resetOTP = undefined;
    taiKhoan.resetOTPExpires = undefined;
    await taiKhoan.save();

    return { message: "Mật khẩu đã được đặt lại thành công" };
};
