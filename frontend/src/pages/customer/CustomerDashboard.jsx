import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bed,
  CalendarDays,
  ConciergeBell,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  mockOnlineBookings,
  mockServiceRequests,
} from "@/mock/customerMockData";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const customerName = localStorage.getItem("customerName") || "Khách hàng";
  const customerId = localStorage.getItem("customerId");

  // Lọc dữ liệu cho khách hàng hiện tại
  const myBookings = mockOnlineBookings.filter(
    (b) => b.customerId === customerId
  );
  const myRequests = mockServiceRequests.filter(
    (r) => r.customerId === customerId
  );

  const pendingBookings = myBookings.filter(
    (b) => b.status === "pending"
  ).length;
  const pendingRequests = myRequests.filter(
    (r) => r.status === "pending"
  ).length;
  const activeBookings = myBookings.filter((b) =>
    ["confirmed", "checked_in"].includes(b.status)
  ).length;

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "Chờ xác nhận", variant: "outline" },
      confirmed: { label: "Đã xác nhận", variant: "default" },
      checked_in: { label: "Đang ở", variant: "secondary" },
      completed: { label: "Hoàn thành", variant: "default" },
      cancelled: { label: "Đã hủy", variant: "destructive" },
      in_progress: { label: "Đang xử lý", variant: "secondary" },
    };
    const info = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Xin chào, {customerName}!
        </h1>
        <p className="text-muted-foreground">
          Chào mừng bạn đến với cổng thông tin khách hàng
        </p>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/customer/my-bookings")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đặt phòng đang chờ
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings}</div>
            <p className="text-xs text-muted-foreground">
              Chờ xác nhận từ khách sạn
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/customer/my-bookings")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đặt phòng hiện tại
            </CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBookings}</div>
            <p className="text-xs text-muted-foreground">
              Đã xác nhận hoặc đang lưu trú
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/customer/services")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Yêu cầu dịch vụ
            </CardTitle>
            <ConciergeBell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Đang chờ xử lý</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/customer/payment")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thanh toán</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Xem ngay</div>
            <p className="text-xs text-muted-foreground">Quản lý thanh toán</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Đặt phòng gần đây</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/customer/my-bookings")}
            >
              Xem tất cả <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {myBookings.length > 0 ? (
              <div className="space-y-4">
                {myBookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Phòng {booking.roomType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.checkInDate} - {booking.checkOutDate}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Chưa có đặt phòng nào</p>
                <Button
                  className="mt-4"
                  onClick={() => navigate("/customer/booking")}
                >
                  Đặt phòng ngay
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Service Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Yêu cầu dịch vụ gần đây</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/customer/services")}
            >
              Xem tất cả <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {myRequests.length > 0 ? (
              <div className="space-y-4">
                {myRequests.slice(0, 3).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {request.serviceName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.description}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Chưa có yêu cầu dịch vụ nào</p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => navigate("/customer/services")}
                >
                  Yêu cầu dịch vụ
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Button
            className="h-auto py-6 flex-col gap-2"
            onClick={() => navigate("/customer/booking")}
          >
            <Bed className="h-6 w-6" />
            <span>Đặt phòng mới</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex-col gap-2"
            onClick={() => navigate("/customer/services")}
          >
            <ConciergeBell className="h-6 w-6" />
            <span>Yêu cầu dịch vụ</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex-col gap-2"
            onClick={() => navigate("/customer/payment")}
          >
            <CreditCard className="h-6 w-6" />
            <span>Thanh toán</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex-col gap-2"
            onClick={() => navigate("/customer/history")}
          >
            <CalendarDays className="h-6 w-6" />
            <span>Xem lịch sử</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
