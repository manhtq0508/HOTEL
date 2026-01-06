import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Users, DollarSign, Bed } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { roomApi, bookingApi, invoiceApi } from "@/api";

export default function Reports() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsData, bookingsData, invoicesData] = await Promise.all([
          roomApi.getRooms(),
          bookingApi.getBookings(),
          invoiceApi.getInvoices(),
        ]);

        // Normalize responses to handle both array and nested object responses
        const normalizedRooms = Array.isArray(roomsData)
          ? roomsData
          : roomsData?.data || [];
        const normalizedBookings = Array.isArray(bookingsData)
          ? bookingsData
          : bookingsData?.data || [];
        const normalizedInvoices = Array.isArray(invoicesData)
          ? invoicesData
          : invoicesData?.data || [];

        setRooms(normalizedRooms);
        setBookings(normalizedBookings);
        setInvoices(normalizedInvoices);
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu báo cáo",
          variant: "destructive",
        });
        setRooms([]);
        setBookings([]);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalRevenue = invoices
    .filter(
      (inv) =>
        inv.TrangThaiThanhToan === "Paid" ||
        inv.paymentStatus === "paid" ||
        inv.TrangThaiThanhToan === 1 ||
        inv.status === "paid"
    )
    .reduce(
      (sum, inv) => sum + (inv.TongTien || inv.TongThanhToan || inv.total || 0),
      0
    );
  const totalBookings = bookings.length;
  const occupancyRate =
    rooms.length > 0
      ? (
          (rooms.filter(
            (r) =>
              r.status === "occupied" ||
              r.TrangThai === "Occupied" ||
              r.TrangThai === 1
          ).length /
            rooms.length) *
          100
        ).toFixed(1)
      : 0;

  const exportRevenueReport = () => {
    if (!invoices.length) {
      toast({ title: "Không có dữ liệu hóa đơn" });
      return;
    }

    const data = invoices.map((inv) => ({
      "Mã hóa đơn": inv.MaHD || inv.id || "",
      "Khách hàng":
        inv.KhachHang?.TenKH || inv.customer?.name || inv.TenKhachHang || "",
      "Ngày lập": inv.NgayLap
        ? new Date(inv.NgayLap).toLocaleDateString("vi-VN")
        : inv.invoiceDate
        ? new Date(inv.invoiceDate).toLocaleDateString("vi-VN")
        : "",
      "Tổng tiền (VNĐ)": inv.TongThanhToan || inv.TongTien || inv.total || 0,
      "Thanh toán":
        inv.PhuongThucThanhToan?.TenPT ||
        inv.paymentMethod?.name ||
        inv.TenPhuongThucTT ||
        "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doanh thu");

    XLSX.writeFile(wb, "bao_cao_doanh_thu.xlsx");
  };

  const exportRoomUsageReport = () => {
    if (!rooms.length) {
      toast({ title: "Không có dữ liệu phòng" });
      return;
    }

    const data = rooms.map((room) => {
      const roomBookings = bookings.filter((b) =>
        (b.RoomIds || b.roomIds || b.PhongIds || []).includes(
          room._id || room.id || room.MaPhong
        )
      );

      return {
        "Mã phòng": room.MaPhong || room.roomNumber || room.id || "",
        "Loại phòng":
          room.LoaiPhong?.TenLoaiPhong ||
          room.roomType?.name ||
          room.TenLoaiPhong ||
          "N/A",
        "Giá phòng (VNĐ)": room.GiaPhong || room.price || room.TienPhong || 0,
        "Trạng thái": room.TrangThai || room.status || "N/A",
        "Số lần được đặt": roomBookings.length,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sử dụng phòng");

    XLSX.writeFile(wb, "bao_cao_su_dung_phong.xlsx");
  };

  const exportServiceUsageReport = () => {
    if (!invoices.length) {
      toast({ title: "Không có dữ liệu dịch vụ" });
      return;
    }

    const serviceMap = {};

    invoices.forEach((inv) => {
      const items = inv.ChiTietHoaDon || inv.items || [];
      items.forEach((item) => {
        const service = item.DichVu || item.service;
        if (!service) return;

        const serviceName = service.TenDV || service.name || "Unknown";
        const key = serviceName;

        if (!serviceMap[key]) {
          serviceMap[key] = {
            "Tên dịch vụ": serviceName,
            "Đơn giá": service.DonGia || service.price || 0,
            "Số lần sử dụng": 0,
            "Doanh thu (VNĐ)": 0,
          };
        }

        serviceMap[key]["Số lần sử dụng"] += item.SoLuong || item.quantity || 1;
        serviceMap[key]["Doanh thu (VNĐ)"] +=
          item.ThanhTien || item.totalPrice || 0;
      });
    });

    const data = Object.values(serviceMap);

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dịch vụ");

    XLSX.writeFile(wb, "bao_cao_dich_vu.xlsx");
  };

  const exportCustomerReport = () => {
    if (!bookings.length) {
      toast({ title: "Không có dữ liệu khách hàng" });
      return;
    }

    const customerMap = {};

    bookings.forEach((b) => {
      const kh = b.KhachHang || b.customer || b.Guest;
      if (!kh) return;

      const customerId = kh._id || kh.id || kh.MaKH;
      const customerName = kh.TenKH || kh.name || "Unknown";

      if (!customerMap[customerId]) {
        customerMap[customerId] = {
          "Tên khách hàng": customerName,
          "Số điện thoại": kh.SDT || kh.phone || kh.SoDienThoai || "N/A",
          "Số lần đặt phòng": 0,
          "Tổng số đêm": 0,
        };
      }

      customerMap[customerId]["Số lần đặt phòng"] += 1;

      const checkIn = new Date(b.NgayDen || b.checkInDate || 0);
      const checkOut = new Date(b.NgayDi || b.checkOutDate || 0);
      const nights = Math.max(
        0,
        Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24))
      );

      customerMap[customerId]["Tổng số đêm"] += nights;
    });

    const data = Object.values(customerMap);

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Khách hàng");

    XLSX.writeFile(wb, "bao_cao_khach_hang.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Báo cáo</h1>
          <p className="text-muted-foreground">
            Xem và xuất các báo cáo thống kê
          </p>
        </div>
      </div>

      {/* Các thẻ */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng doanh thu
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalRevenue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">VNĐ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số đặt phòng</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">Tổng số đơn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tỷ lệ sử dụng phòng
            </CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">Trung bình</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                bookings.filter(
                  (b) =>
                    b.status === "checked_in" || b.TrangThai === "CheckedIn"
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Đang lưu trú</p>
          </CardContent>
        </Card>
      </div>

      {/* Loại báo cáo */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Báo cáo doanh thu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Báo cáo chi tiết về doanh thu theo khoảng thời gian, loại phòng và
              dịch vụ
            </p>
            <Button className="w-full gap-2" onClick={exportRevenueReport}>
              <Download className="h-4 w-4" />
              Xuất báo cáo doanh thu
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Báo cáo tỷ lệ sử dụng phòng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Thống kê tỷ lệ sử dụng phòng theo thời gian và loại phòng
            </p>
            <Button className="w-full gap-2" onClick={exportRoomUsageReport}>
              <Download className="h-4 w-4" />
              Xuất báo cáo sử dụng phòng
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Báo cáo dịch vụ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Thống kê sử dụng các dịch vụ bổ sung và doanh thu từ dịch vụ
            </p>
            <Button className="w-full gap-2" onClick={exportServiceUsageReport}>
              <Download className="h-4 w-4" />
              Xuất báo cáo dịch vụ
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Báo cáo khách hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Thống kê khách hàng mới, khách quay lại và mức độ hài lòng
            </p>
            <Button className="w-full gap-2" onClick={exportCustomerReport}>
              <Download className="h-4 w-4" />
              Xuất báo cáo khách hàng
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
