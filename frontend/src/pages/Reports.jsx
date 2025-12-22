import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Users, DollarSign, Bed } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
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
          invoiceApi.getInvoices()
        ]);
        setRooms(roomsData || []);
        setBookings(bookingsData || []);
        setInvoices(invoicesData || []);
      } catch (error) {
        console.error('Error fetching report data:', error);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu báo cáo",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalRevenue = invoices
    .filter((i) => i.TrangThaiThanhToan === "Paid" || i.paymentStatus === "paid")
    .reduce((sum, inv) => sum + (inv.TongTien || inv.total || 0), 0);
  const totalBookings = bookings.length;
  const occupancyRate = rooms.length > 0 ? (
    (rooms.filter((r) => r.status === "occupied" || r.TrangThai === "Occupied").length /
      rooms.length) *
    100
  ).toFixed(1) : 0;

  const exportRevenueReport = () => {
    const data = mockInvoices
      .filter((i) => i.paymentStatus === "paid")
      .map((inv) => ({
        "Mã hóa đơn": inv.id,
        "Khách hàng": inv.customerName,
        Ngày: inv.date,
        "Tổng tiền (VNĐ)": inv.total,
        "Trạng thái": inv.paymentStatus,
      }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Doanh thu");

    XLSX.writeFile(workbook, "bao_cao_doanh_thu.xlsx");

    toast({
      title: "Xuất báo cáo thành công",
      description: "File Excel đã được tải xuống",
    });
  };
  const exportRoomUsageReport = () => {
    const data = mockRooms.map((room) => {
      const bookings = mockBookings.filter((b) => b.roomId === room.id);

      return {
        "Mã phòng": room.id,
        "Loại phòng": room.type,
        "Giá phòng": room.price,
        "Trạng thái hiện tại": room.status,
        "Số lần được đặt": bookings.length,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sử dụng phòng");

    XLSX.writeFile(wb, "bao_cao_su_dung_phong.xlsx");
  };

  const exportServiceUsageReport = () => {
    const serviceMap = {};

    mockInvoices.forEach((invoice) => {
      invoice.items.forEach((item) => {
        // Bỏ qua tiền phòng
        if (item.description.toLowerCase().includes("phòng")) return;

        if (!serviceMap[item.description]) {
          serviceMap[item.description] = {
            "Tên dịch vụ": item.description,
            "Số lần sử dụng": 0,
            "Tổng số lượng": 0,
            "Đơn giá": item.unitPrice,
            "Doanh thu (VNĐ)": 0,
          };
        }

        serviceMap[item.description]["Số lần sử dụng"] += 1;
        serviceMap[item.description]["Tổng số lượng"] += item.quantity;
        serviceMap[item.description]["Doanh thu (VNĐ)"] += item.total;
      });
    });

    const data = Object.values(serviceMap);

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sử dụng dịch vụ");

    XLSX.writeFile(workbook, "bao_cao_su_dung_dich_vu.xlsx");
  };

  const exportCustomerReport = () => {
    const data = mockGuests.map((guest) => {
      const bookings = mockBookings.filter((b) => b.guestId === guest.id);

      const invoices = mockInvoices.filter(
        (i) => i.guestId === guest.id && i.paymentStatus === "paid"
      );

      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

      return {
        "Mã khách hàng": guest.id,
        "Tên khách hàng": guest.name,
        "Số điện thoại": guest.phone,
        Email: guest.email,
        "Số lần đặt phòng": bookings.length,
        "Tổng số đêm lưu trú": bookings.reduce((sum, b) => {
          const inDate = new Date(b.checkInDate);
          const outDate = new Date(b.checkOutDate);
          const nights = (outDate - inDate) / (1000 * 60 * 60 * 24);
          return sum + nights;
        }, 0),
        "Tổng chi tiêu (VNĐ)": totalRevenue,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Khách hàng");

    XLSX.writeFile(workbook, "bao_cao_khach_hang.xlsx");
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
              {bookings.filter((b) => b.status === "checked_in" || b.TrangThai === "CheckedIn").length}
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
