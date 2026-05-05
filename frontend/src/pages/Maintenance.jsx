import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Trash2,
  PenBox,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import maintenanceApi from "@/api/maintenanceApi";
import { bookingApi, roomApi, staffApi } from "@/api";

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const userRole = localStorage.getItem("role");
  const [rooms, setRooms] = useState([]);
  const [techStaff, setTechStaff] = useState([]);
  const [bookings, setBookings] = useState([]);
  // Create/Edit Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    MaPBT: "",
    Phong: "",
    NVKyThuat: "",
    NgayBatDau: "",
    NgayKetThuc: "",
    NoiDung: "",
  });

  useEffect(() => {
    fetchData();
  }, []);
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d)) return "";
    return d.toISOString().split("T")[0];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsRes, roomsRes, staffRes, Bookings] = await Promise.all([
        maintenanceApi.getMaintenanceRecords(),
        roomApi.getRooms(),
        staffApi.getStaff(),
        bookingApi.getBookings(),
      ]);

      setRecords(recordsRes);
      setBookings(Bookings);
      setRooms(Array.isArray(roomsRes) ? roomsRes : roomsRes.data || []);
      setTechStaff(Array.isArray(staffRes) ? staffRes : staffRes.data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu bảo trì",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  console.log(bookings);
  const handleCreate = async () => {
    try {
      // 🔹 Validate rỗng
      if (
        !formData.MaPBT ||
        !formData.Phong ||
        !formData.NVKyThuat ||
        !formData.NgayThucHien ||
        !formData.NgayKetThuc ||
        !formData.NoiDung
      ) {
        toast({
          title: "Vui lòng điền đầy đủ thông tin",
          variant: "destructive",
        });
        return;
      }

      // 🔹 TÌM BOOKING THEO PHÒNG
      const bookingByRoom = bookings.find(
        (b) => b.roomId?.toString() === formData.Phong?.toString()
      );

      console.log("bookingByRoom", bookingByRoom);
      // 🔹 NẾU PHÒNG ĐÃ ĐƯỢC ĐẶT
      if (bookingByRoom) {
        const ngayDi = formatDate(bookingByRoom.NgayDi);
        console.log("ngayDi", ngayDi);
        
        // Validate date must be >= ngayDi
        if (formData.NgayThucHien < ngayDi) {
          toast({
            title: "Ngày thực hiện không hợp lệ",
            description: `Phòng đang có khách, ngày thực hiện phải từ ngày ${ngayDi} trở đi`,
            variant: "destructive",
          });
          return;
        }
      }

      // 🔹 CALL API
      await maintenanceApi.createMaintenanceRecord(formData);

      await roomApi.updateRoom(formData.Phong, {
        TrangThai: "Maintenance",
      });

      toast({ title: "Tạo phiếu bảo trì thành công" });
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast({
        title: "Lỗi khi tạo phiếu",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    try {
      await maintenanceApi.updateMaintenanceRecord(editingRecord._id, {
        NoiDung: formData.NoiDung,
        NVKyThuat: formData.NVKyThuat,
      });
      toast({ title: "Cập nhật thành công" });
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast({
        title: "Lỗi cập nhật",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phiếu này?")) return;
    try {
      await maintenanceApi.deleteMaintenanceRecord(id);
      toast({ title: "Đã xóa phiếu bảo trì" });
      fetchData();
    } catch (error) {
      toast({ title: "Lỗi xóa phiếu", variant: "destructive" });
    }
  };

  const handleComplete = async (record) => {
    try {
      await maintenanceApi.updateMaintenanceRecord(record._id, {
        TrangThai: "Completed",
        NgayKetThuc: new Date(),
      });
      await roomApi.updateRoom(record.Phong._id, {
        TrangThai: "Available",
      });
      toast({
        title: "Đã hoàn thành bảo trì",
        description: `Phòng ${record.Phong?.MaPhong} đã chuyển sang trạng thái Sẵn sàng`,
      });
      fetchData();
    } catch (error) {
      toast({ title: "Lỗi cập nhật trạng thái", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingRecord(null);
    setFormData({
      MaPBT: "",
      Phong: "",
      NVKyThuat: "",
      NoiDung: "",
    });
  };
  const addOneDay = (date) => {
    if (!date) return ""; // chặn null / undefined

    const d = new Date(date);
    if (isNaN(d.getTime())) return ""; // chặn invalid date

    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const openCreateDialog = async () => {
    resetForm();
    try {
      const nextCode = await maintenanceApi.getNextMaPBTCode();
      setFormData((prev) => ({ ...prev, MaPBT: nextCode }));
    } catch (err) {
      console.error("Error fetching next MaPBT:", err);
    }
    setIsDialogOpen(true);
  };

  const openEditDialog = (record) => {
    setEditingRecord(record);
    setFormData({
      MaPBT: record.MaPBT,
      Phong: record.Phong?._id || record.Phong,
      NVKyThuat: record.NVKyThuat?._id || record.NVKyThuat,
      NgayThucHien: record.NgayThucHien,
      NgayKetThuc: record.NgayKetThuc,
      NoiDung: record.NoiDung,
    });
    setIsDialogOpen(true);
  };

  // Kiểm tra xem phòng có được đặt hay không
  const getRoomBookingStatus = (roomId) => {
    const booking = bookings.find(
      (b) => b.Phong?._id === roomId || b.Phong === roomId
    );
    if (booking) {
      return {
        isBooked: true,
        checkOutDate: booking.NgayDi, // Ngày đi = NgayThucHien
      };
    }
    return { isBooked: false, checkOutDate: null };
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.MaPBT?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.Phong?.MaPhong?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || r.TrangThai === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bảo trì phòng</h1>
          <p className="text-muted-foreground">
            Quản lý các phiếu yêu cầu bảo trì và sửa chữa
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> Tạo phiếu mới
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo Mã phiếu, Mã phòng..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">Tất cả trạng thái</SelectItem>
            <SelectItem value="Pending">Đang xử lý</SelectItem>
            <SelectItem value="Completed">Đã hoàn thành</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã phiếu</TableHead>
              <TableHead>Phòng</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead>Kỹ thuật viên</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Không có phiếu bảo trì nào
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => (
                <TableRow key={record._id}>
                  <TableCell className="font-medium">{record.MaPBT}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {record.Phong?.MaPhong || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] truncate"
                    title={record.NoiDung}
                  >
                    {record.NoiDung}
                  </TableCell>
                  <TableCell>{record.NVKyThuat?.HoTen || "N/A"}</TableCell>
                  <TableCell>
                    {record.createdAt
                      ? format(new Date(record.createdAt), "dd/MM/yyyy HH:mm")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {record.NgayKetThuc
                      ? format(new Date(record.NgayKetThuc), "dd/MM/yyyy HH:mm")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.TrangThai === "Completed"
                          ? "default"
                          : "secondary"
                      }
                      className={
                        record.TrangThai === "Completed"
                          ? "bg-green-500 hover:bg-green-600"
                          : ""
                      }
                    >
                      {record.TrangThai === "Completed"
                        ? "Hoàn thành"
                        : "Đang xử lý"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => openEditDialog(record)}
                        >
                          <PenBox className="mr-2 h-4 w-4" /> Chỉnh sửa
                        </DropdownMenuItem>
                        {record.TrangThai !== "Completed" && (
                          <DropdownMenuItem
                            onClick={() => handleComplete(record)}
                            className="text-green-600 focus:text-green-600"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Hoàn thành
                          </DropdownMenuItem>
                        )}
                        {(userRole === "Admin" || userRole === "Manager") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(record._id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Xóa phiếu
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingRecord
                ? "Chỉnh sửa phiếu bảo trì"
                : "Tạo phiếu bảo trì mới"}
            </DialogTitle>
            <DialogDescription>
              {editingRecord
                ? "Cập nhật thông tin phiếu bảo trì"
                : "Điền thông tin để tạo phiếu yêu cầu bảo trì cho phòng"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mapbt" className="text-right">
                Mã phiếu
              </Label>
              <Input
                id="mapbt"
                value={formData.MaPBT}
                readOnly
                className="col-span-3 bg-muted"
                placeholder="PBT..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phong" className="text-right">
                Phòng
              </Label>
              <Select
                value={formData.Phong}
                onValueChange={(v) => {
                  const { isBooked, checkOutDate } = getRoomBookingStatus(v);
                  setFormData({
                    ...formData,
                    Phong: v,
                    NgayThucHien: isBooked && (!formData.NgayThucHien || formData.NgayThucHien < checkOutDate)
                      ? checkOutDate
                      : formData.NgayThucHien,
                  });
                }}
                disabled={!!editingRecord}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn phòng" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.MaPhong} - {r.LoaiPhong?.TenLoaiPhong}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nv" className="text-right">
                Kỹ thuật
              </Label>
              <Select
                value={formData.NVKyThuat}
                onValueChange={(v) =>
                  setFormData({ ...formData, NVKyThuat: v })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {techStaff.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.HoTen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="check-in">Ngày bắt đầu</Label>
                <Input
                  id="check-in"
                  type="date"
                  value={formData.NgayThucHien}
                  onChange={(e) =>
                    setFormData({ ...formData, NgayThucHien: e.target.value })
                  }
                  disabled={false}
                  min={
                    formData.Phong &&
                    getRoomBookingStatus(formData.Phong).isBooked
                      ? formatDate(getRoomBookingStatus(formData.Phong).checkOutDate)
                      : undefined
                  }
                  title={
                    formData.Phong &&
                    getRoomBookingStatus(formData.Phong).isBooked
                      ? "Phòng đang có khách, vui lòng chọn ngày sau khi khách trả phòng"
                      : ""
                  }
                />
                {formData.Phong &&
                  getRoomBookingStatus(formData.Phong).isBooked && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Phòng đang có khách - Ngày bảo trì phải từ ngày khách đi trở đi
                    </p>
                  )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="check-out">Ngày kết thúc dự tính</Label>
                <Input
                  id="check-out"
                  type="date"
                  value={formData.NgayKetThuc}
                  onChange={(e) =>
                    setFormData({ ...formData, NgayKetThuc: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="noidung" className="text-right">
                Nội dung
              </Label>
              <Textarea
                id="noidung"
                value={formData.NoiDung}
                onChange={(e) =>
                  setFormData({ ...formData, NoiDung: e.target.value })
                }
                className="col-span-3"
                placeholder="Mô tả sự cố..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={editingRecord ? handleUpdate : handleCreate}>
              {editingRecord ? "Cập nhật" : "Tạo phiếu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
