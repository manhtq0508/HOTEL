import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Calendar, X, Plus, AlertCircle } from "lucide-react";
import { mockOnlineBookings } from "@/mock/customerMockData";
import { bookingApi } from "@/api";

export default function CustomerMyBookings() {
  const customerId = localStorage.getItem("customerId");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newCheckOutDate, setNewCheckOutDate] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const bookingsData = await bookingApi.getBookings();
        setBookings(bookingsData || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách đặt phòng",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const myOnlineBookings = mockOnlineBookings.filter(b => b.customerId === customerId);
  const allBookings = [...myOnlineBookings, ...bookings.slice(0, 2).map(b => ({
    ...b,
    roomType: b.LoaiPhong || "Standard",
    source: "direct",
    depositPaid: b.TienCoc || 0,
  }))];

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "Chờ xác nhận", variant: "outline", color: "text-yellow-600" },
      confirmed: { label: "Đã xác nhận", variant: "default", color: "text-blue-600" },
      checked_in: { label: "Đang lưu trú", variant: "secondary", color: "text-green-600" },
      checked_out: { label: "Đã trả phòng", variant: "outline", color: "text-gray-600" },
      cancelled: { label: "Đã hủy", variant: "destructive", color: "text-red-600" },
      Pending: { label: "Chờ xác nhận", variant: "outline", color: "text-yellow-600" },
      Confirmed: { label: "Đã xác nhận", variant: "default", color: "text-blue-600" },
      CheckedIn: { label: "Đang lưu trú", variant: "secondary", color: "text-green-600" },
      CheckedOut: { label: "Đã trả phòng", variant: "outline", color: "text-gray-600" },
      Cancelled: { label: "Đã hủy", variant: "destructive", color: "text-red-600" },
    };
    const info = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const canCancel = (status) => ["pending", "confirmed", "Pending", "Confirmed"].includes(status);
  const canExtend = (status) => ["confirmed", "checked_in", "Confirmed", "CheckedIn"].includes(status);

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleExtendClick = (booking) => {
    setSelectedBooking(booking);
    setNewCheckOutDate(booking.checkOutDate);
    setExtendDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    toast({
      title: "Hủy đặt phòng thành công",
      description: "Đặt phòng của bạn đã được hủy. Tiền cọc sẽ được hoàn lại theo chính sách.",
    });
    setCancelDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleConfirmExtend = () => {
    if (!newCheckOutDate || new Date(newCheckOutDate) <= new Date(selectedBooking.checkOutDate)) {
      toast({
        title: "Ngày không hợp lệ",
        description: "Ngày trả phòng mới phải sau ngày trả phòng hiện tại",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Yêu cầu gia hạn đã được gửi",
      description: "Chúng tôi sẽ xác nhận yêu cầu gia hạn của bạn sớm nhất có thể",
    });
    setExtendDialogOpen(false);
    setSelectedBooking(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Đặt phòng của tôi</h1>
        <p className="text-muted-foreground">Quản lý các đặt phòng của bạn</p>
      </div>

      {/* Nguyên tắc */}
      <Card className="border-warning/50 bg-warning/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Quy định đặt phòng
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• Hủy đặt phòng trước 48 giờ: Hoàn lại 100% tiền cọc</p>
          <p>• Hủy đặt phòng trước 24 giờ: Hoàn lại 50% tiền cọc</p>
          <p>• Hủy đặt phòng trong vòng 24 giờ: Không hoàn lại tiền cọc</p>
          <p>• Gia hạn lưu trú: Phụ thuộc vào tình trạng phòng trống</p>
        </CardContent>
      </Card>

      {/* Danh sách đặt phòng */}
      <div className="space-y-4">
        {allBookings.length > 0 ? (
          allBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Phòng {booking.roomType || "Standard"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Mã đặt phòng: {booking.id}</p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Nhận phòng</p>
                      <p className="font-medium">{booking.checkInDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Trả phòng</p>
                      <p className="font-medium">{booking.checkOutDate}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tổng tiền</p>
                    <p className="font-bold text-primary">{booking.totalAmount?.toLocaleString()} VNĐ</p>
                  </div>
                </div>

                {booking.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Ghi chú: </span>
                    {booking.notes}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  {canExtend(booking.status) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExtendClick(booking)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Gia hạn
                    </Button>
                  )}
                  {canCancel(booking.status) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleCancelClick(booking)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Hủy đặt phòng
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Bạn chưa có đặt phòng nào</p>
              <Button className="mt-4" onClick={() => window.location.href = "/customer/booking"}>
                Đặt phòng ngay
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Popup hủy đặt phòng */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hủy đặt phòng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy đặt phòng này? Việc hoàn tiền cọc sẽ theo chính sách của khách sạn.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-2 text-sm">
              <p><strong>Mã đặt phòng:</strong> {selectedBooking.id}</p>
              <p><strong>Loại phòng:</strong> {selectedBooking.roomType}</p>
              <p><strong>Ngày:</strong> {selectedBooking.checkInDate} - {selectedBooking.checkOutDate}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Đóng</Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>Xác nhận hủy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup gia hạn */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gia hạn lưu trú</DialogTitle>
            <DialogDescription>
              Chọn ngày trả phòng mới. Yêu cầu sẽ được xác nhận dựa trên tình trạng phòng trống.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <p><strong>Ngày trả phòng hiện tại:</strong> {selectedBooking.checkOutDate}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-checkout">Ngày trả phòng mới</Label>
                <Input 
                  id="new-checkout"
                  type="date" 
                  value={newCheckOutDate}
                  onChange={(e) => setNewCheckOutDate(e.target.value)}
                  min={selectedBooking.checkOutDate}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleConfirmExtend}>Gửi yêu cầu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
