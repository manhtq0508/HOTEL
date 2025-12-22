import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Eye, Trash2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bookingApi, roomApi, customerApi } from "@/api";

export default function Bookings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    HangPhong: "",
    NgayDen: "",
    NgayDi: "",
    SoKhach: 1,
    TienCoc: 0,
    GhiChu: ""
  });
  const [customers, setCustomers] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    loadBookings();
    loadCustomers();
    loadRooms();
  }, []);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const data = await bookingApi.getBookings();
      setBookings(data);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách đặt phòng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await customerApi.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const loadRooms = async () => {
    try {
      const data = await roomApi.getRooms();
      setRooms(data);
    } catch (error) {
      console.error("Error loading rooms:", error);
    }
  };

  const handleCreateBooking = async () => {
    if (!formData.HangPhong || !formData.NgayDen || !formData.NgayDi) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    try {
      await bookingApi.createBooking({
        ...formData,
        SoKhach: parseInt(formData.SoKhach),
        TienCoc: parseFloat(formData.TienCoc),
        TrangThai: "Pending"
      });
      toast({
        title: "Thành công",
        description: "Đặt phòng mới đã được tạo",
      });
      setFormData({
        HangPhong: "",
        NgayDen: "",
        NgayDi: "",
        SoKhach: 1,
        TienCoc: 0,
        GhiChu: ""
      });
      setIsCreateOpen(false);
      loadBookings();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo đặt phòng",
        variant: "destructive",
      });
    }
  };

  const handleViewDetail = (booking) => {
    setSelectedBooking(booking);
    setIsViewDetailOpen(true);
  };

  const handleCancelBooking = (booking) => {
    setSelectedBooking(booking);
    setIsCancelOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await bookingApi.cancelBooking(selectedBooking._id);
      toast({
        title: "Đã hủy",
        description: "Đặt phòng đã được hủy thành công",
      });
      setIsCancelOpen(false);
      loadBookings();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể hủy đặt phòng",
        variant: "destructive",
      });
    }
  };

  const handleCheckIn = (booking) => {
    setSelectedBooking(booking);
    setIsCheckInOpen(true);
  };

  const handleConfirmCheckIn = async () => {
    try {
      await bookingApi.updateBooking(selectedBooking._id, {
        ...selectedBooking,
        TrangThai: "CheckedIn"
      });
      toast({
        title: "Thành công",
        description: "Đã nhận phòng thành công",
      });
      setIsCheckInOpen(false);
      loadBookings();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thực hiện check-in",
        variant: "destructive",
      });
    }
  };

  const handleCheckOut = (booking) => {
    setSelectedBooking(booking);
    setIsCheckOutOpen(true);
  };

  const handleConfirmCheckOut = async () => {
    try {
      await bookingApi.updateBooking(selectedBooking._id, {
        ...selectedBooking,
        TrangThai: "CheckedOut"
      });
      toast({
        title: "Thành công",
        description: "Đã trả phòng thành công",
      });
      setIsCheckOutOpen(false);
      loadBookings();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thực hiện check-out",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: { label: "Chờ xác nhận", className: "bg-warning text-warning-foreground" },
      Confirmed: { label: "Đã xác nhận", className: "bg-primary text-primary-foreground" },
      CheckedIn: { label: "Đã nhận phòng", className: "bg-success text-success-foreground" },
      CheckedOut: { label: "Đã trả phòng", className: "bg-secondary text-secondary-foreground" },
      Cancelled: { label: "Đã hủy", className: "bg-destructive text-destructive-foreground" },
    };
    const config = statusConfig[status] || { label: status, className: "bg-gray-500" };
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      (booking.MaDatPhong && booking.MaDatPhong.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (booking.KhachHang && booking.KhachHang.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      filterStatus === "all" || booking.TrangThai === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Quản lý đặt phòng
          </h1>
          <p className="text-muted-foreground">
            Quản lý các đơn đặt phòng và lịch trình
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo đặt phòng mới
        </Button>
      </div>

      {/* Các thẻ */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chờ xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.filter((b) => b.TrangThai === "Pending").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đã xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.filter((b) => b.TrangThai === "Confirmed").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đã nhận phòng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.filter((b) => b.TrangThai === "CheckedIn").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đã trả phòng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.filter((b) => b.TrangThai === "CheckedOut").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã đặt phòng, tên khách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Pending">Chờ xác nhận</SelectItem>
                <SelectItem value="Confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="CheckedIn">Đã nhận phòng</SelectItem>
                <SelectItem value="CheckedOut">Đã trả phòng</SelectItem>
                <SelectItem value="Cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bảng đặt phòng*/}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đặt phòng ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đặt phòng</TableHead>
                  <TableHead>Hạng phòng</TableHead>
                  <TableHead>Nhận phòng</TableHead>
                  <TableHead>Trả phòng</TableHead>
                  <TableHead>Số khách</TableHead>
                  <TableHead>Tiền cọc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell className="font-medium">{booking.MaDatPhong}</TableCell>
                    <TableCell>{booking.HangPhong}</TableCell>
                    <TableCell>
                      {booking.NgayDen ? new Date(booking.NgayDen).toLocaleDateString("vi-VN") : "N/A"}
                    </TableCell>
                    <TableCell>
                      {booking.NgayDi ? new Date(booking.NgayDi).toLocaleDateString("vi-VN") : "N/A"}
                    </TableCell>
                    <TableCell>{booking.SoKhach}</TableCell>
                    <TableCell>{booking.TienCoc?.toLocaleString("vi-VN") || "0"} VNĐ</TableCell>
                    <TableCell>{getStatusBadge(booking.TrangThai)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetail(booking)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {booking.TrangThai === "Confirmed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCheckIn(booking)}
                          >
                            Check-in
                          </Button>
                        )}
                        {booking.TrangThai === "CheckedIn" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCheckOut(booking)}
                          >
                            Check-out
                          </Button>
                        )}
                        {booking.TrangThai !== "Cancelled" && booking.TrangThai !== "CheckedOut" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancelBooking(booking)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* PopUp tạo đặt phòng */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tạo đặt phòng mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roomType">Hạng phòng</Label>
              <Input 
                id="roomType" 
                placeholder="Ví dụ: Standard, Deluxe, Suite"
                value={formData.HangPhong}
                onChange={(e) => setFormData({...formData, HangPhong: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checkIn">Ngày nhận phòng</Label>
              <Input 
                id="checkIn" 
                type="date"
                value={formData.NgayDen}
                onChange={(e) => setFormData({...formData, NgayDen: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checkOut">Ngày trả phòng</Label>
              <Input 
                id="checkOut" 
                type="date"
                value={formData.NgayDi}
                onChange={(e) => setFormData({...formData, NgayDi: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guests">Số khách</Label>
              <Input 
                id="guests" 
                type="number"
                min="1"
                value={formData.SoKhach}
                onChange={(e) => setFormData({...formData, SoKhach: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deposit">Tiền cọc (VNĐ)</Label>
              <Input 
                id="deposit" 
                type="number"
                value={formData.TienCoc}
                onChange={(e) => setFormData({...formData, TienCoc: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea 
                id="notes" 
                placeholder="Ghi chú đặc biệt..."
                value={formData.GhiChu}
                onChange={(e) => setFormData({...formData, GhiChu: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateBooking}>Tạo đặt phòng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PopUp chi tiết đặt phòng */}
      <Dialog open={isViewDetailOpen} onOpenChange={setIsViewDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết đặt phòng</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Mã đặt phòng</Label>
                  <p className="text-lg font-semibold">{selectedBooking.MaDatPhong}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Trạng thái</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedBooking.TrangThai)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hạng phòng</Label>
                  <p className="text-lg font-semibold">
                    {selectedBooking.HangPhong}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Số khách</Label>
                  <p className="text-lg font-semibold">
                    {selectedBooking.SoKhach} người
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ngày nhận</Label>
                  <p className="text-lg font-semibold">
                    {selectedBooking.NgayDen ? new Date(selectedBooking.NgayDen).toLocaleDateString("vi-VN") : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ngày trả</Label>
                  <p className="text-lg font-semibold">
                    {selectedBooking.NgayDi ? new Date(selectedBooking.NgayDi).toLocaleDateString("vi-VN") : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tiền cọc</Label>
                  <p className="text-lg font-semibold">
                    {selectedBooking.TienCoc?.toLocaleString("vi-VN") || "0"} VNĐ
                  </p>
                </div>
              </div>
              {selectedBooking.GhiChu && (
                <div>
                  <Label className="text-muted-foreground">Ghi chú</Label>
                  <p className="mt-1">{selectedBooking.GhiChu}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PopUp hủy đặt phòng */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hủy đặt phòng</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="py-4">
              <p>
                Bạn có chắc chắn muốn hủy đặt phòng{" "}
                <strong>{selectedBooking.MaDatPhong}</strong>?
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              Không
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PopUp checkin */}
      <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nhận phòng (Check-in)</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-muted-foreground">Mã đặt phòng</Label>
                <p className="text-lg font-semibold">{selectedBooking.MaDatPhong}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Hạng phòng</Label>
                <p className="text-lg font-semibold">
                  {selectedBooking.HangPhong}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Số khách</Label>
                <p className="text-lg font-semibold">
                  {selectedBooking.SoKhach} người
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckInOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleConfirmCheckIn}>Xác nhận check-in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PopUp checkout */}
      <Dialog open={isCheckOutOpen} onOpenChange={setIsCheckOutOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Trả phòng (Check-out)</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-muted-foreground">Mã đặt phòng</Label>
                <p className="text-lg font-semibold">{selectedBooking.MaDatPhong}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Hạng phòng</Label>
                <p className="text-lg font-semibold">
                  {selectedBooking.HangPhong}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Số khách</Label>
                <p className="text-lg font-semibold">
                  {selectedBooking.SoKhach} người
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Hệ thống sẽ tự động tạo hóa đơn sau khi check-out.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckOutOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleConfirmCheckOut}>Xác nhận check-out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
