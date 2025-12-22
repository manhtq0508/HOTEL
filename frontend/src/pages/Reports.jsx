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
        setRooms(roomsData || []);
        setBookings(bookingsData || []);
        setInvoices(invoicesData || []);
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu báo cáo",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalRevenue = invoices
    .filter(
      (i) => i.TrangThaiThanhToan === "Paid" || i.paymentStatus === "paid"
    )
    .reduce((sum, inv) => sum + (inv.TongTien || inv.total || 0), 0);
  const totalBookings = bookings.length;
  const occupancyRate =
    rooms.length > 0
      ? (
          (rooms.filter(
            (r) => r.status === "occupied" || r.TrangThai === "Occupied"
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
      "Mã hóa đơn": inv.MaHD,
      "Khách hàng": inv.KhachHang?.TenKH || "",
      "Ngày lập": new Date(inv.NgayLap).toLocaleDateString(),
      "Tổng tiền (VNĐ)": inv.TongThanhToan,
      "Thanh toán": inv.PhuongThucThanhToan?.TenPT || "",
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
        (b.RoomIds || b.roomIds || []).includes(room._id)
      );

      return {
        "Mã phòng": room.MaPhong,
        "Loại phòng": room.LoaiPhong?.TenLoaiPhong || "N/A",
        "Giá phòng (VNĐ)": room.GiaPhong,
        "Trạng thái": room.TrangThai,
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
      inv.ChiTietHoaDon?.forEach((item) => {
        if (!item.DichVu) return;

        const key = item.DichVu.TenDV;

        if (!serviceMap[key]) {
          serviceMap[key] = {
            "Tên dịch vụ": key,
            "Đơn giá": item.DichVu.DonGia,
            "Số lần sử dụng": 0,
            "Doanh thu (VNĐ)": 0,
          };
        }

        serviceMap[key]["Số lần sử dụng"] += item.SoLuong;
        serviceMap[key]["Doanh thu (VNĐ)"] += item.ThanhTien;
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
      const kh = b.KhachHang;
      if (!kh) return;

      if (!customerMap[kh._id]) {
        customerMap[kh._id] = {
          "Tên khách hàng": kh.TenKH,
          "Số điện thoại": kh.SDT,
          "Số lần đặt phòng": 0,
          "Tổng số đêm": 0,
        };
      }

      customerMap[kh._id]["Số lần đặt phòng"] += 1;

      const nights =
        (new Date(b.NgayDi) - new Date(b.NgayDen)) / (1000 * 60 * 60 * 24);

      customerMap[kh._id]["Tổng số đêm"] += nights;
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
