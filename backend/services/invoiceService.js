const HoaDon = require("../models/HoaDon");
const PhieuThuePhong = require("../models/PhieuThuePhong");
const DichVu = require("../models/DichVu");
const SuDungDichVu = require("../models/SuDungDichVu");
const CaiDat = require("../models/CaiDat");

exports.createInvoice = async (data, user) => {

  const nhanVien = (data.NhanVienThuNgan && data.NhanVienThuNgan !== '')
    ? data.NhanVienThuNgan
    : user?.id;

  const builder = new InvoiceBuilder();

  await builder.setBooking(data.PhieuThuePhong);
  await builder.calculateRoomCharges(data.TongTienPhong);
  await builder.addServiceUsages();

  builder.applyCharges({
    PhuThu: data.PhuThu,
    TienBoiThuong: data.TienBoiThuong,
    TienDaCoc: data.TienDaCoc,
  });
  builder.setPayment({
    NhanVienThuNgan: nhanVien,
    PhuongThucThanhToan: data.PhuongThucThanhToan,
  });

  return builder.build();
};

exports.createCheckoutInvoice = async (data) => {
  
  const builder = new InvoiceBuilder();

  await builder.setBooking(data.PhieuThuePhong);
  await builder.calculateRoomCharges(data.TongTienPhong);
  await builder.addServiceUsages();

  builder.applyCharges({
    PhuThu: data.PhuThu,
    TienBoiThuong: data.TienBoiThuong,
    TienDaCoc: data.TienDaCoc,
  });
  builder.setPayment({
    NhanVienThuNgan: data.NhanVienThuNgan,
    PhuongThucThanhToan: data.PhuongThucThanhToan,
  });

  return builder.build();
};
