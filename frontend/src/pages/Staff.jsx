import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockStaff } from "@/mock/mockData";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Staff() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const handleAddStaff = () => {
    toast({
      title: "Thành công",
      description: "Nhân viên mới đã được thêm",
    });
    setIsAddOpen(false);
  };

  const handleEdit = (staff) => {
    setSelectedStaff(staff);
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    toast({
      title: "Thành công",
      description: "Thông tin nhân viên đã được cập nhật",
    });
    setIsEditOpen(false);
  };

  const handleDelete = (staff) => {
    setSelectedStaff(staff);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    toast({
      title: "Đã xóa",
      description: "Nhân viên đã được xóa khỏi hệ thống",
    });
    setIsDeleteOpen(false);
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { label: "Quản trị viên", variant: "default" },
      manager: { label: "Quản lý", variant: "default" },
      front_desk: { label: "Lễ tân", variant: "secondary" },
      housekeeping: { label: "Buồng phòng", variant: "outline" },
      technician: { label: "Kỹ thuật", variant: "outline" },
    };
    return <Badge variant={roleConfig[role].variant}>{roleConfig[role].label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý nhân viên</h1>
          <p className="text-muted-foreground">Quản lý thông tin và phân quyền nhân viên</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Các thẻ */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng nhân viên</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStaff.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockStaff.filter(s => s.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lễ tân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockStaff.filter(s => s.role === "front_desk").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quản lý</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockStaff.filter(s => s.role === "admin" || s.role === "manager").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bảng nv */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã NV</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.id}</TableCell>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell>{getRoleBadge(staff.role)}</TableCell>
                  <TableCell>{staff.email}</TableCell>
                  <TableCell>{staff.phone}</TableCell>
                  <TableCell>
                    <Badge variant={staff.status === "active" ? "default" : "outline"}>
                      {staff.status === "active" ? "Đang làm việc" : "Ngừng hoạt động"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(staff)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(staff)}>
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

      {/* PopUp thêm nv */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm nhân viên mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="staffName">Họ và tên</Label>
              <Input id="staffName" placeholder="Nhập họ tên đầy đủ" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Vai trò</Label>
              <Select>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="manager">Quản lý</SelectItem>
                  <SelectItem value="front_desk">Lễ tân</SelectItem>
                  <SelectItem value="housekeeping">Buồng phòng</SelectItem>
                  <SelectItem value="technician">Kỹ thuật</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="staffEmail">Email</Label>
              <Input id="staffEmail" type="email" placeholder="email@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="staffPhone">Số điện thoại</Label>
              <Input id="staffPhone" placeholder="Ví dụ: 0901234567" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select defaultValue="active">
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang làm việc</SelectItem>
                  <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Hủy</Button>
            <Button onClick={handleAddStaff}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PopUp cập nhật nv */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa nhân viên</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-staffName">Họ và tên</Label>
                <Input id="edit-staffName" defaultValue={selectedStaff.name} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Vai trò</Label>
                <Select defaultValue={selectedStaff.role}>
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Quản trị viên</SelectItem>
                    <SelectItem value="manager">Quản lý</SelectItem>
                    <SelectItem value="front_desk">Lễ tân</SelectItem>
                    <SelectItem value="housekeeping">Buồng phòng</SelectItem>
                    <SelectItem value="technician">Kỹ thuật</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-staffEmail">Email</Label>
                <Input id="edit-staffEmail" type="email" defaultValue={selectedStaff.email} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-staffPhone">Số điện thoại</Label>
                <Input id="edit-staffPhone" defaultValue={selectedStaff.phone} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Trạng thái</Label>
                <Select defaultValue={selectedStaff.status}>
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Đang làm việc</SelectItem>
                    <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveEdit}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PopUp xóa nv */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Xóa nhân viên</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="py-4">
              <p>Bạn có chắc chắn muốn xóa nhân viên <strong>{selectedStaff.name}</strong>?</p>
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
