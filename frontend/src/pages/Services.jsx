import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { mockServices } from "@/mock/mockData";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Services() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const handleAddService = () => {
    toast({
      title: "Thành công",
      description: "Dịch vụ mới đã được thêm",
    });
    setIsAddOpen(false);
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    toast({
      title: "Thành công",
      description: "Thông tin dịch vụ đã được cập nhật",
    });
    setIsEditOpen(false);
  };

  const handleDelete = (service) => {
    setSelectedService(service);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    toast({
      title: "Đã xóa",
      description: "Dịch vụ đã được xóa",
    });
    setIsDeleteOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý dịch vụ</h1>
          <p className="text-muted-foreground">Quản lý các dịch vụ bổ sung của khách sạn</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Thêm dịch vụ mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách dịch vụ ({mockServices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã dịch vụ</TableHead>
                <TableHead>Tên dịch vụ</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Đơn giá</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.id}</TableCell>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.category}</TableCell>
                  <TableCell className="font-medium">{service.unitPrice.toLocaleString('vi-VN')} VNĐ</TableCell>
                  <TableCell className="max-w-xs truncate">{service.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(service)}>
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

      {/* Add Service Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm dịch vụ mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="serviceName">Tên dịch vụ</Label>
              <Input id="serviceName" placeholder="Ví dụ: Giặt ủi" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Danh mục</Label>
              <Input id="category" placeholder="Ví dụ: Dọn phòng" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitPrice">Đơn giá (VNĐ)</Label>
              <Input id="unitPrice" type="number" placeholder="Ví dụ: 50000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea id="description" placeholder="Mô tả chi tiết dịch vụ..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Hủy</Button>
            <Button onClick={handleAddService}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa dịch vụ</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-serviceName">Tên dịch vụ</Label>
                <Input id="edit-serviceName" defaultValue={selectedService.name} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Danh mục</Label>
                <Input id="edit-category" defaultValue={selectedService.category} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-unitPrice">Đơn giá (VNĐ)</Label>
                <Input id="edit-unitPrice" type="number" defaultValue={selectedService.unitPrice} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Mô tả</Label>
                <Textarea id="edit-description" defaultValue={selectedService.description} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveEdit}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Xóa dịch vụ</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="py-4">
              <p>Bạn có chắc chắn muốn xóa dịch vụ <strong>{selectedService.name}</strong>?</p>
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
