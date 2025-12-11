import { useState } from "react";
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
import { mockBookings, mockGuests, mockRooms } from "@/mock/mockData";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Bookings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const handleCreateBooking = () => {
    toast({
      title: "Thành công",
      description: "Đặt phòng mới đã được tạo",
    });
    setIsCreateOpen(false);
  };

  const handleViewDetail = (booking) => {
    setSelectedBooking(booking);
    setIsViewDetailOpen(true);
  };

  const handleCancelBooking = (booking) => {
    setSelectedBooking(booking);
    setIsCancelOpen(true);
  };

  const handleConfirmCancel = () => {
    toast({
      title: "Đã hủy",
      description: "Đặt phòng đã được hủy thành công",
    });
    setIsCancelOpen(false);
  };

  const handleCheckIn = (booking) => {
    setSelectedBooking(booking);
    setIsCheckInOpen(true);
  };

  const handleConfirmCheckIn = () => {
    toast({
      title: "Thành công",
      description: "Đã nhận phòng thành công",
    });
    setIsCheckInOpen(false);
  };

  const handleCheckOut = (booking) => {
    setSelectedBooking(booking);
    setIsCheckOutOpen(true);
  };

  const handleConfirmCheckOut = () => {
    toast({
      title: "Thành công",
      description: "Đã trả phòng thành công",
    });
    setIsCheckOutOpen(false);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Chờ xác nhận", variant: "outline" },
      confirmed: { label: "Đã xác nhận", variant: "default" },
      checked_in: { label: "Đã nhận phòng", variant: "secondary" },
      checked_out: { label: "Đã trả phòng", variant: "outline" },
      cancelled: { label: "Đã hủy", variant: "destructive" },
    };
    return (
      <Badge variant={statusConfig[status].variant}>
        {statusConfig[status].label}
      </Badge>
    );
  };

  const bookingsWithDetails = mockBookings.map((booking) => {
    const guest = mockGuests.find((g) => g.id === booking.guestId);
    const rooms = booking.roomIds
      .map((id) => mockRooms.find((r) => r.id === id)?.roomNumber)
      .join(", ");
    return { ...booking, guestName: guest?.name || "N/A", roomNumbers: rooms };
  });

  const filteredBookings = bookingsWithDetails.filter((booking) => {
    const matchesSearch =
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.roomNumbers.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || booking.status === filterStatus;
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "Tổng số", count: mockBookings.length, status: "all" },
          {
            label: "Chờ xác nhận",
            count: mockBookings.filter((b) => b.status === "pending").length,
            status: "pending",
          },
          {
            label: "Đã xác nhận",
            count: mockBookings.filter((b) => b.status === "confirmed").length,
            status: "confirmed",
          },
          {
            label: "Đã nhận phòng",
            count: mockBookings.filter((b) => b.status === "checked_in").length,
            status: "checked_in",
          },
          {
            label: "Đã trả phòng",
            count: mockBookings.filter((b) => b.status === "checked_out")
              .length,
            status: "checked_out",
          },
        ].map((item) => (
          <Card
            key={item.status}
            className="cursor-pointer hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã đặt phòng, tên khách, số phòng..."
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
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="checked_in">Đã nhận phòng</SelectItem>
                <SelectItem value="checked_out">Đã trả phòng</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đặt phòng ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đặt phòng</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead>Nhận phòng</TableHead>
                <TableHead>Trả phòng</TableHead>
                <TableHead>Số khách</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.id}</TableCell>
                  <TableCell>{booking.guestName}</TableCell>
                  <TableCell>{booking.roomNumbers}</TableCell>
                  <TableCell>
                    {new Date(booking.checkInDate).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    {new Date(booking.checkOutDate).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>{booking.numberOfGuests}</TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell className="font-medium">
                    {booking.totalAmount.toLocaleString("vi-VN")} VNĐ
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetail(booking)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {booking.status === "confirmed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCheckIn(booking)}
                        >
                          Check-in
                        </Button>
                      )}
                      {booking.status === "checked_in" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCheckOut(booking)}
                        >
                          Check-out
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancelBooking(booking)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Booking Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tạo đặt phòng mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="guestName">Họ tên khách hàng</Label>
              <Input id="guestName" placeholder="Nhập họ tên" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="roomType">Loại phòng</Label>
              <Select>
                <SelectTrigger id="roomType">
                  <SelectValue placeholder="Chọn loại phòng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Deluxe">Deluxe</SelectItem>
                  <SelectItem value="Suite">Suite</SelectItem>
                  <SelectItem value="Presidential">Presidential</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checkIn">Ngày nhận phòng</Label>
              <Input id="checkIn" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checkOut">Ngày trả phòng</Label>
              <Input id="checkOut" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea id="notes" placeholder="Ghi chú đặc biệt..." />
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

      {/* View Detail Dialog */}
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
                  <p className="text-lg font-semibold">{selectedBooking.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Trạng thái</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedBooking.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Khách hàng</Label>
                  <p className="text-lg font-semibold">
                    {selectedBooking.guestName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phòng</Label>
                  <p className="text-lg font-semibold">
                    {selectedBooking.roomNumbers}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ngày nhận</Label>
                  <p className="text-lg font-semibold">
                    {new Date(selectedBooking.checkInDate).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ngày trả</Label>
                  <p className="text-lg font-semibold">
                    {new Date(selectedBooking.checkOutDate).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hủy đặt phòng</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="py-4">
              <p>
                Bạn có chắc chắn muốn hủy đặt phòng{" "}
                <strong>{selectedBooking.id}</strong>?
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

      {/* Check-in Dialog */}
      <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nhận phòng (Check-in)</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-muted-foreground">Mã đặt phòng</Label>
                <p className="text-lg font-semibold">{selectedBooking.id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Khách hàng</Label>
                <p className="text-lg font-semibold">
                  {selectedBooking.guestName}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phòng</Label>
                <p className="text-lg font-semibold">
                  {selectedBooking.roomNumbers}
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

      {/* Check-out Dialog */}
      <Dialog open={isCheckOutOpen} onOpenChange={setIsCheckOutOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Trả phòng (Check-out)</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-muted-foreground">Mã đặt phòng</Label>
                <p className="text-lg font-semibold">{selectedBooking.id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Khách hàng</Label>
                <p className="text-lg font-semibold">
                  {selectedBooking.guestName}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phòng</Label>
                <p className="text-lg font-semibold">
                  {selectedBooking.roomNumbers}
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
