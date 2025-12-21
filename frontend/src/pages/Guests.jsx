import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { mockGuests, mockBookings } from "@/mock/mockData";
import { Plus, Search, Eye, Edit, Trash2, Phone, Mail } from "lucide-react";

export default function Guests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);

  const handleAddGuest = () => {
    toast({
      title: "Thành công",
      description: "Khách hàng mới đã được thêm",
    });
    setIsAddOpen(false);
  };

  const handleViewDetail = (guest) => {
    setSelectedGuest(guest);
    setIsViewDetailOpen(true);
  };

  const handleEdit = (guest) => {
    setSelectedGuest(guest);
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    toast({
      title: "Thành công",
      description: "Thông tin khách hàng đã được cập nhật",
    });
    setIsEditOpen(false);
  };

  const handleDelete = (guest) => {
    setSelectedGuest(guest);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    toast({
      title: "Đã xóa",
      description: "Khách hàng đã được xóa khỏi hệ thống",
    });
    setIsDeleteOpen(false);
  };

  const guestsWithBookings = mockGuests.map((guest) => {
    const bookings = mockBookings.filter(b => b.guestId === guest.id);
    const activeBooking = bookings.find(b => b.status === "checked_in" || b.status === "confirmed");
    return { 
      ...guest, 
      totalBookings: bookings.length,
      currentStatus: activeBooking ? activeBooking.status : "none"
    };
  });

  const filteredGuests = guestsWithBookings.filter((guest) => {
    const matchesSearch = 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone.includes(searchTerm) ||
      guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.idNumber.includes(searchTerm);
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý khách hàng</h1>
          <p className="text-muted-foreground">Quản lý thông tin khách hàng và lịch sử đặt phòng</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Thêm khách hàng mới
        </Button>
      </div>

      {/* Các thẻ */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockGuests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang lưu trú
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {guestsWithBookings.filter(g => g.currentStatus === "checked_in").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Có đặt phòng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {guestsWithBookings.filter(g => g.currentStatus === "confirmed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tìm kiếm */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, số điện thoại, email, CMND..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bảng kh */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách khách hàng ({filteredGuests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã KH</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>CMND/Passport</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Lượt đặt</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuests.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell className="font-medium">{guest.id}</TableCell>
                  <TableCell className="font-medium">{guest.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {guest.phone}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {guest.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{guest.idNumber}</TableCell>
                  <TableCell>{guest.address}</TableCell>
                  <TableCell>{guest.totalBookings}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetail(guest)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(guest)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(guest)}>
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

      {/* PopUp thêm kh */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm khách hàng mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input id="name" placeholder="Nhập họ tên đầy đủ" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" placeholder="Ví dụ: 0901234567" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="example@email.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="idNumber">CMND/CCCD</Label>
              <Input id="idNumber" placeholder="Số chứng minh thư" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input id="address" placeholder="Địa chỉ liên hệ" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Hủy</Button>
            <Button onClick={handleAddGuest}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PopUp chi tiết kh */}
      <Dialog open={isViewDetailOpen} onOpenChange={setIsViewDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết khách hàng</DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Mã khách hàng</Label>
                  <p className="text-lg font-semibold">{selectedGuest.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Họ và tên</Label>
                  <p className="text-lg font-semibold">{selectedGuest.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Số điện thoại</Label>
                  <p className="text-lg font-semibold">{selectedGuest.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="text-lg font-semibold">{selectedGuest.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">CMND/CCCD</Label>
                  <p className="text-lg font-semibold">{selectedGuest.idNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Địa chỉ</Label>
                  <p className="text-lg font-semibold">{selectedGuest.address}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Số lần đặt phòng</Label>
                  <p className="text-lg font-semibold">{selectedGuest.totalBookings}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PopUp xóa kh */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khách hàng</DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Họ và tên</Label>
                <Input id="edit-name" defaultValue={selectedGuest.name} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Số điện thoại</Label>
                <Input id="edit-phone" defaultValue={selectedGuest.phone} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" defaultValue={selectedGuest.email} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-idNumber">CMND/CCCD</Label>
                <Input id="edit-idNumber" defaultValue={selectedGuest.idNumber} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Địa chỉ</Label>
                <Input id="edit-address" defaultValue={selectedGuest.address} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveEdit}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PopUp xóa kh */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Xóa khách hàng</DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <div className="py-4">
              <p>Bạn có chắc chắn muốn xóa khách hàng <strong>{selectedGuest.name}</strong>?</p>
              <p className="text-sm text-muted-foreground mt-2">Hành động này không thể hoàn tác.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Xác nhận xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
