import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Users, DollarSign, Bed } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { mockBookings, mockRooms, mockInvoices } from "@/mock/mockData";

export default function Reports() {
  const totalRevenue = mockInvoices
    .filter((i) => i.paymentStatus === "paid")
    .reduce((sum, inv) => sum + inv.total, 0);
  const totalBookings = mockBookings.length;
  const occupancyRate = (
    (mockRooms.filter((r) => r.status === "occupied").length /
      mockRooms.length) *
    100
  ).toFixed(1);

  const handleExportReport = (reportType) => {
    toast({
      title: "Đang xuất báo cáo",
      description: `Báo cáo ${reportType} đang được xuất...`,
    });
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
              {mockBookings.filter((b) => b.status === "checked_in").length}
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
            <Button
              className="w-full gap-2"
              onClick={() => handleExportReport("doanh thu")}
            >
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
            <Button
              className="w-full gap-2"
              onClick={() => handleExportReport("sử dụng phòng")}
            >
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
            <Button
              className="w-full gap-2"
              onClick={() => handleExportReport("dịch vụ")}
            >
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
            <Button
              className="w-full gap-2"
              onClick={() => handleExportReport("khách hàng")}
            >
              <Download className="h-4 w-4" />
              Xuất báo cáo khách hàng
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
