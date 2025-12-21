import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockRooms } from "@/mock/mockData";
import { Edit, Eye, MoreVertical, Search, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Rooms() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  const handleSaveNewRoom = () => {
    toast({
      title: "Thành công",
      description: "Phòng mới đã được thêm thành công",
    });
    setIsAddRoomOpen(false);
  };

  const handleViewDetail = (room) => {
    setSelectedRoom(room);
    setIsViewDetailOpen(true);
  };

  const handleEdit = (room) => {
    setSelectedRoom(room);
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    toast({
      title: "Thành công",
      description: "Thông tin phòng đã được cập nhật",
    });
    setIsEditOpen(false);
  };

  const handleChangeStatus = (room) => {
    setSelectedRoom(room);
    setIsChangeStatusOpen(true);
  };

  const handleSaveStatus = () => {
    toast({
      title: "Thành công",
      description: "Trạng thái phòng đã được cập nhật",
    });
    setIsChangeStatusOpen(false);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { label: "Trống", className: "bg-success text-success-foreground" },
      occupied: { label: "Đang sử dụng", className: "bg-primary text-primary-foreground" },
      reserved: { label: "Đã đặt", className: "bg-warning text-warning-foreground" },
      cleaning: { label: "Đang dọn", className: "bg-secondary text-secondary-foreground" },
      maintenance: { label: "Bảo trì", className: "bg-destructive text-destructive-foreground" },
    };
    return (
      <Badge className={statusConfig[status].className}>
        {statusConfig[status].label}
      </Badge>
    );
  };

  const filteredRooms = mockRooms.filter((room) => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || room.type === filterType;
    const matchesStatus = filterStatus === "all" || room.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý phòng</h1>
          <p className="text-muted-foreground">Quản lý thông tin và trạng thái các phòng</p>
        </div>
        <Button onClick={() => setIsAddRoomOpen(true)}>Thêm phòng mới</Button>
      </div>

      {/* Các thẻ */}
      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "Tổng số", count: mockRooms.length, status: "all" },
          { label: "Trống", count: mockRooms.filter(r => r.status === "available").length, status: "available" },
          { label: "Đang sử dụng", count: mockRooms.filter(r => r.status === "occupied").length, status: "occupied" },
          { label: "Đã đặt", count: mockRooms.filter(r => r.status === "reserved").length, status: "reserved" },
          { label: "Bảo trì", count: mockRooms.filter(r => r.status === "maintenance").length, status: "maintenance" },
        ].map((item) => (
          <Card key={item.status} className="cursor-pointer hover:shadow-md transition-shadow">
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo số phòng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại phòng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Deluxe">Deluxe</SelectItem>
                <SelectItem value="Suite">Suite</SelectItem>
                <SelectItem value="Presidential">Presidential</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="available">Trống</SelectItem>
                <SelectItem value="occupied">Đang sử dụng</SelectItem>
                <SelectItem value="reserved">Đã đặt</SelectItem>
                <SelectItem value="cleaning">Đang dọn</SelectItem>
                <SelectItem value="maintenance">Bảo trì</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách phòng */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách phòng ({filteredRooms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Số phòng</TableHead>
                <TableHead>Loại phòng</TableHead>
                <TableHead>Tầng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Giá/đêm</TableHead>
                <TableHead>Sức chứa</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.roomNumber}</TableCell>
                  <TableCell>{room.type}</TableCell>
                  <TableCell>Tầng {room.floor}</TableCell>
                  <TableCell>{getStatusBadge(room.status)}</TableCell>
                  <TableCell>{room.price.toLocaleString('vi-VN')} VNĐ</TableCell>
                  <TableCell>{room.maxGuests} người</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetail(room)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(room)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeStatus(room)}>
                          Đổi trạng thái
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Popup thêm phòng */}
      <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm phòng mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roomNumber">Số phòng</Label>
              <Input id="roomNumber" placeholder="Ví dụ: 301" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Loại phòng</Label>
              <Select>
                <SelectTrigger id="type">
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
              <Label htmlFor="floor">Tầng</Label>
              <Input id="floor" type="number" placeholder="Ví dụ: 3" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Giá/đêm (VNĐ)</Label>
              <Input id="price" type="number" placeholder="Ví dụ: 1500000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxGuests">Sức chứa (người)</Label>
              <Input id="maxGuests" type="number" placeholder="Ví dụ: 2" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select defaultValue="available">
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Trống</SelectItem>
                  <SelectItem value="occupied">Đang sử dụng</SelectItem>
                  <SelectItem value="reserved">Đã đặt</SelectItem>
                  <SelectItem value="cleaning">Đang dọn</SelectItem>
                  <SelectItem value="maintenance">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoomOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveNewRoom}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup chi tiết phòng */}
      <Dialog open={isViewDetailOpen} onOpenChange={setIsViewDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết phòng</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Số phòng</Label>
                  <p className="text-lg font-semibold">{selectedRoom.roomNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Loại phòng</Label>
                  <p className="text-lg font-semibold">{selectedRoom.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tầng</Label>
                  <p className="text-lg font-semibold">Tầng {selectedRoom.floor}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Trạng thái</Label>
                  <div className="mt-1">{getStatusBadge(selectedRoom.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Giá/đêm</Label>
                  <p className="text-lg font-semibold">{selectedRoom.price.toLocaleString('vi-VN')} VNĐ</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sức chứa</Label>
                  <p className="text-lg font-semibold">{selectedRoom.maxGuests} người</p>
                </div>
              </div>
              {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Tiện nghi</Label>
                  <p className="mt-1">{selectedRoom.amenities.join(", ")}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup câp nhật phòng */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa phòng</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Loại phòng</Label>
                <Select defaultValue={selectedRoom.type}>
                  <SelectTrigger id="edit-type">
                    <SelectValue />
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
                <Label htmlFor="edit-price">Giá/đêm (VNĐ)</Label>
                <Input id="edit-price" type="number" defaultValue={selectedRoom.price} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Trạng thái</Label>
                <Select defaultValue={selectedRoom.status}>
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Trống</SelectItem>
                    <SelectItem value="occupied">Đang sử dụng</SelectItem>
                    <SelectItem value="reserved">Đã đặt</SelectItem>
                    <SelectItem value="cleaning">Đang dọn</SelectItem>
                    <SelectItem value="maintenance">Bảo trì</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-maxGuests">Sức chứa (người)</Label>
                <Input id="edit-maxGuests" type="number" defaultValue={selectedRoom.maxGuests} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveEdit}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup đổi trạng thái phòng */}
      <Dialog open={isChangeStatusOpen} onOpenChange={setIsChangeStatusOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Đổi trạng thái phòng</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-muted-foreground">Phòng</Label>
                <p className="text-lg font-semibold">{selectedRoom.roomNumber}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-status">Trạng thái mới</Label>
                <Select defaultValue={selectedRoom.status}>
                  <SelectTrigger id="new-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Trống</SelectItem>
                    <SelectItem value="occupied">Đang sử dụng</SelectItem>
                    <SelectItem value="reserved">Đã đặt</SelectItem>
                    <SelectItem value="cleaning">Đang dọn</SelectItem>
                    <SelectItem value="maintenance">Bảo trì</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangeStatusOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveStatus}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
