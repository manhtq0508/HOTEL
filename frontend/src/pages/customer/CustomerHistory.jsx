import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, ConciergeBell } from "lucide-react";
import { mockOnlineBookings, mockServiceRequests } from "@/mock/customerMockData";

export default function CustomerHistory() {
  const customerId = localStorage.getItem("customerId");
  const myBookings = mockOnlineBookings.filter(b => b.customerId === customerId);
  const myRequests = mockServiceRequests.filter(r => r.customerId === customerId);

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "Chờ xác nhận", variant: "outline" },
      confirmed: { label: "Đã xác nhận", variant: "default" },
      checked_in: { label: "Đang lưu trú", variant: "secondary" },
      checked_out: { label: "Đã trả phòng", variant: "outline" },
      cancelled: { label: "Đã hủy", variant: "destructive" },
      completed: { label: "Hoàn thành", variant: "default" },
      in_progress: { label: "Đang xử lý", variant: "secondary" },
    };
    const info = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Lịch sử</h1>
        <p className="text-muted-foreground">Xem lại lịch sử đặt phòng và dịch vụ</p>
      </div>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings" className="gap-2">
            <CalendarDays className="h-4 w-4" /> Đặt phòng
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <ConciergeBell className="h-4 w-4" /> Dịch vụ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-6">
          {myBookings.length > 0 ? (
            <div className="space-y-4">
              {myBookings.map(booking => (
                <Card key={booking.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Phòng {booking.roomType}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.checkInDate} - {booking.checkOutDate}
                        </p>
                        <p className="text-sm mt-1">Mã: {booking.id}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(booking.status)}
                        <p className="font-bold mt-2">{booking.totalAmount.toLocaleString()} VNĐ</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Chưa có lịch sử đặt phòng</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          {myRequests.length > 0 ? (
            <div className="space-y-4">
              {myRequests.map(request => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{request.serviceName}</p>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(request.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(request.status)}
                        <p className="font-bold mt-2">{request.amount.toLocaleString()} VNĐ</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Chưa có lịch sử dịch vụ</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
