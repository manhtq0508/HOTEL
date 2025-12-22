import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockMaintenanceTickets } from "@/mock/mockData";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { roomApi } from "@/api";

export default function Maintenance() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const roomsData = await roomApi.getRooms();
        setRooms(roomsData || []);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách phòng",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleCreateTicket = () => {
    toast({
      title: "Thành công",
      description: "Phiếu bảo trì đã được tạo",
    });
    setIsCreateOpen(false);
  };

  const handleUpdateStatus = (ticket) => {
    setSelectedTicket(ticket);
    setIsUpdateStatusOpen(true);
  };

  const handleConfirmUpdateStatus = () => {
    toast({
      title: "Thành công",
      description: "Trạng thái phiếu bảo trì đã được cập nhật",
    });
    setIsUpdateStatusOpen(false);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { label: "Mới", variant: "destructive" },
      in_progress: { label: "Đang xử lý", variant: "default" },
      completed: { label: "Hoàn thành", variant: "secondary" },
    };
    return <Badge variant={statusConfig[status].variant}>{statusConfig[status].label}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { label: "Thấp", className: "bg-muted" },
      medium: { label: "Trung bình", className: "bg-warning text-warning-foreground" },
      high: { label: "Cao", className: "bg-destructive text-destructive-foreground" },
    };
    return <Badge className={priorityConfig[priority]?.className || "bg-muted"}>{priorityConfig[priority]?.label || priority}</Badge>;
  };

  const ticketsWithDetails = mockMaintenanceTickets.map((ticket) => {
    const room = rooms.find(r => r.id === ticket.roomId || r.MaPhong === ticket.roomId);
    return { 
      ...ticket, 
      roomNumber: room?.roomNumber || room?.MaPhong || "N/A",
      assignedName: ticket.assignedTo || "Chưa phân công"
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý bảo trì</h1>
          <p className="text-muted-foreground">Theo dõi và xử lý các yêu cầu bảo trì</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo phiếu bảo trì
        </Button>
      </div>

      {/* Các thẻ */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMaintenanceTickets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mới</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockMaintenanceTickets.filter(t => t.status === "new").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang xử lý</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockMaintenanceTickets.filter(t => t.status === "in_progress").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockMaintenanceTickets.filter(t => t.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bảng phiếu bảo trì */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách phiếu bảo trì</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã phiếu</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Độ ưu tiên</TableHead>
                <TableHead>Người phụ trách</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketsWithDetails.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.id}</TableCell>
                  <TableCell>Phòng {ticket.roomNumber}</TableCell>
                  <TableCell className="font-medium">{ticket.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{ticket.description}</TableCell>
                  <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                  <TableCell>{ticket.assignedName}</TableCell>
                  <TableCell>
                    <button onClick={() => handleUpdateStatus(ticket)} className="cursor-pointer">
                      {getStatusBadge(ticket.status)}
                    </button>
                  </TableCell>
                  <TableCell>{new Date(ticket.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PopUp tạo phiếu */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tạo phiếu bảo trì</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roomId">Mã phòng</Label>
              <Input id="roomId" placeholder="Ví dụ: R101" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input id="title" placeholder="Ví dụ: Thay bóng đèn" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ticketDescription">Mô tả chi tiết</Label>
              <Textarea id="ticketDescription" placeholder="Mô tả vấn đề cần bảo trì..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Mức độ ưu tiên</Label>
              <Select defaultValue="medium">
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="urgent">Khẩn cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignedTo">Giao cho kỹ thuật viên</Label>
              <Input id="assignedTo" placeholder="Chọn kỹ thuật viên" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateTicket}>Tạo phiếu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PopUp Cập nhật phiếu */}
      <Dialog open={isUpdateStatusOpen} onOpenChange={setIsUpdateStatusOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-muted-foreground">Phiếu bảo trì</Label>
                <p className="text-lg font-semibold">{selectedTicket.id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phòng</Label>
                <p className="text-lg font-semibold">{selectedTicket.roomNumber}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newStatus">Trạng thái mới</Label>
                <Select defaultValue={selectedTicket.status}>
                  <SelectTrigger id="newStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Mới</SelectItem>
                    <SelectItem value="in_progress">Đang xử lý</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateStatusOpen(false)}>Hủy</Button>
            <Button onClick={handleConfirmUpdateStatus}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
