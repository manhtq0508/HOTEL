import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bed, Users, DollarSign, CalendarCheck, Plus, LogIn, LogOut, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { roomApi, bookingApi, customerApi } from "@/api";

export default function Dashboard() {
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [newGuestOpen, setNewGuestOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsData, bookingsData, guestsData] = await Promise.all([
          roomApi.getRooms(),
          bookingApi.getBookings(),
          customerApi.getCustomers()
        ]);
        setRooms(roomsData || []);
        setBookings(bookingsData || []);
        setGuests(guestsData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu dashboard",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === "occupied").length;
  const availableRooms = rooms.filter(r => r.status === "available").length;
  const checkedInGuests = bookings.filter(b => b.status === "checked_in").length;
  
  const todayRevenue = 12500000;
  const monthRevenue = 250000000;
  const occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(0);

  const recentBookings = bookings.slice(0, 5).map(booking => {
    const guest = guests.find(g => g.id === booking.guestId || g.MaKH === booking.guestId);
    const room = rooms.find(r => r.id === booking.roomIds?.[0] || r.MaPhong === booking.roomIds?.[0]);
    return { 
      ...booking, 
      guestName: guest?.name || guest?.HoTen || 'Unknown', 
      roomNumber: room?.roomNumber || room?.MaPhong || 'Unknown' 
    };
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "Chờ xác nhận", variant: "outline" },
      confirmed: { label: "Đã xác nhận", variant: "default" },
      checked_in: { label: "Đã nhận phòng", variant: "secondary" },
      checked_out: { label: "Đã trả phòng", variant: "outline" },
      cancelled: { label: "Đã hủy", variant: "destructive" },
    };
    const status_info = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={status_info.variant}>{status_info.label}</Badge>;
  };

  const handleNewBooking = () => {
    toast({
      title: "Đã tạo đặt phòng thành công",
      description: "Thông tin đặt phòng đã được lưu.",
    });
    setNewBookingOpen(false);
  };

  const handleCheckIn = () => {
    toast({
      title: "Nhận phòng thành công",
      description: "Khách hàng đã được nhận phòng.",
    });
    setCheckInOpen(false);
  };

  const handleCheckOut = () => {
    toast({
      title: "Trả phòng thành công",
      description: "Khách hàng đã trả phòng.",
    });
    setCheckOutOpen(false);
  };

  const handleCreateInvoice = () => {
    toast({
      title: "Đã tạo hóa đơn thành công",
      description: "Hóa đơn đã được lưu vào hệ thống.",
    });
    setInvoiceOpen(false);
  };

  const handleNewGuest = () => {
    toast({
      title: "Đã thêm khách hàng mới",
      description: "Thông tin khách hàng đã được lưu.",
    });
    setNewGuestOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tổng quan</h1>
          <p className="text-muted-foreground">Chào mừng đến hệ thống quản lý khách sạn</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => setNewBookingOpen(true)}>
            <Plus className="h-4 w-4" />
            Đặt phòng mới
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số phòng</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRooms}</div>
            <p className="text-xs text-muted-foreground">
              {availableRooms} phòng trống
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phòng đang sử dụng</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupiedRooms}</div>
            <p className="text-xs text-muted-foreground">
              Tỷ lệ lấp đầy: {occupancyRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách đang ở</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkedInGuests}</div>
            <p className="text-xs text-muted-foreground">
              Đã nhận phòng hôm nay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(todayRevenue / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">
              Tháng này: {(monthRevenue / 1000000).toFixed(0)}M VNĐ
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Đặt phòng gần đây */}
        <Card>
          <CardHeader>
            <CardTitle>Đặt phòng gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{booking.guestName}</p>
                    <p className="text-xs text-muted-foreground">
                      Phòng {booking.roomNumber} • {booking.checkInDate} - {booking.checkOutDate}
                    </p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Thao tác nhanh */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start gap-2" onClick={() => setCheckInOpen(true)}>
              <LogIn className="h-4 w-4" />
              Nhận phòng (Check-in)
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => setCheckOutOpen(true)}>
              <LogOut className="h-4 w-4" />
              Trả phòng (Check-out)
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => setInvoiceOpen(true)}>
              <FileText className="h-4 w-4" />
              Tạo hóa đơn
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => setNewGuestOpen(true)}>
              <Plus className="h-4 w-4" />
              Thêm khách hàng mới
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* PopUp đặt phòng mới */}
      <Dialog open={newBookingOpen} onOpenChange={setNewBookingOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Đặt phòng mới</DialogTitle>
            <DialogDescription>Điền thông tin đặt phòng cho khách hàng</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="guest-name">Họ tên khách hàng</Label>
              <Input id="guest-name" placeholder="Nhập họ tên" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="room-type">Loại phòng</Label>
              <Select>
                <SelectTrigger id="room-type">
                  <SelectValue placeholder="Chọn loại phòng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Phòng đơn (Single)</SelectItem>
                  <SelectItem value="double">Phòng đôi (Double)</SelectItem>
                  <SelectItem value="suite">Phòng suite</SelectItem>
                  <SelectItem value="deluxe">Phòng deluxe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="check-in">Ngày nhận phòng</Label>
              <Input id="check-in" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="check-out">Ngày trả phòng</Label>
              <Input id="check-out" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewBookingOpen(false)}>Hủy</Button>
            <Button onClick={handleNewBooking}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PopUp checkin */}
      <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nhận phòng (Check-in)</DialogTitle>
            <DialogDescription>Nhập mã đặt phòng để xác nhận nhận phòng</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="booking-id-checkin">Mã đặt phòng</Label>
              <Input id="booking-id-checkin" placeholder="Ví dụ: BK001" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInOpen(false)}>Hủy</Button>
            <Button onClick={handleCheckIn}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PopUp checkout */}
      <Dialog open={checkOutOpen} onOpenChange={setCheckOutOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Trả phòng (Check-out)</DialogTitle>
            <DialogDescription>Nhập mã đặt phòng để xác nhận trả phòng</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="booking-id-checkout">Mã đặt phòng</Label>
              <Input id="booking-id-checkout" placeholder="Ví dụ: BK001" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckOutOpen(false)}>Hủy</Button>
            <Button onClick={handleCheckOut}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup tạo hđ */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tạo hóa đơn</DialogTitle>
            <DialogDescription>Điền thông tin để tạo hóa đơn mới</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invoice-id">Mã hóa đơn</Label>
              <Input id="invoice-id" placeholder="Tự động tạo" disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-id">Mã khách hàng</Label>
              <Input id="customer-id" placeholder="Nhập mã khách hàng" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoice-date">Ngày lập</Label>
              <Input id="invoice-date" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total-amount">Tổng tiền (VNĐ)</Label>
              <Input id="total-amount" type="number" placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>Đóng</Button>
            <Button onClick={handleCreateInvoice}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PopUp thêm kh mới */}
      <Dialog open={newGuestOpen} onOpenChange={setNewGuestOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm khách hàng mới</DialogTitle>
            <DialogDescription>Nhập thông tin khách hàng vào hệ thống</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="guest-fullname">Họ tên</Label>
              <Input id="guest-fullname" placeholder="Nhập họ tên đầy đủ" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest-phone">Số điện thoại</Label>
              <Input id="guest-phone" type="tel" placeholder="0912345678" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest-email">Email</Label>
              <Input id="guest-email" type="email" placeholder="example@email.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest-id-number">CMND/CCCD</Label>
              <Input id="guest-id-number" placeholder="Nhập số CMND/CCCD" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGuestOpen(false)}>Đóng</Button>
            <Button onClick={handleNewGuest}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
