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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockInvoices, mockGuests, mockBookings } from "@/mock/mockData";
import { Plus, Download, Eye, DollarSign } from "lucide-react";

export default function Invoices() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handleCreateInvoice = () => {
    toast({
      title: "Thành công",
      description: "Hóa đơn mới đã được tạo",
    });
    setIsCreateOpen(false);
  };

  const handleViewDetail = (invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDetailOpen(true);
  };

  const handlePrint = (invoice) => {
    setSelectedInvoice(invoice);
    setIsPrintOpen(true);
  };

  const handleConfirmPrint = () => {
    toast({
      title: "Đang in",
      description: "Hóa đơn đang được in...",
    });
    setIsPrintOpen(false);
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      unpaid: { label: "Chưa thanh toán", variant: "destructive" },
      paid: { label: "Đã thanh toán", variant: "default" },
      refunded: { label: "Đã hoàn tiền", variant: "secondary" },
    };
    return <Badge variant={statusConfig[status].variant}>{statusConfig[status].label}</Badge>;
  };

  const invoicesWithDetails = mockInvoices.map((invoice) => {
    const guest = mockGuests.find(g => g.id === invoice.guestId);
    const booking = mockBookings.find(b => b.id === invoice.bookingId);
    return { ...invoice, guestName: guest?.name || "N/A", bookingId: booking?.id || "N/A" };
  });

  const totalRevenue = mockInvoices.filter(i => i.paymentStatus === "paid").reduce((sum, inv) => sum + inv.total, 0);
  const unpaidAmount = mockInvoices.filter(i => i.paymentStatus === "unpaid").reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý hóa đơn</h1>
          <p className="text-muted-foreground">Tạo và quản lý hóa đơn thanh toán</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo hóa đơn mới
        </Button>
      </div>

      {/* Các thẻ */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng hóa đơn</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockInvoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã thanh toán</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockInvoices.filter(i => i.paymentStatus === "paid").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {(totalRevenue / 1000000).toFixed(1)}M VNĐ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chưa thanh toán</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockInvoices.filter(i => i.paymentStatus === "unpaid").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {(unpaidAmount / 1000000).toFixed(1)}M VNĐ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã hoàn tiền</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockInvoices.filter(i => i.paymentStatus === "refunded").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bảng hđ */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách hóa đơn</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã hóa đơn</TableHead>
                <TableHead>Mã đặt phòng</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicesWithDetails.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.bookingId}</TableCell>
                  <TableCell>{invoice.guestName}</TableCell>
                  <TableCell>{new Date(invoice.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell className="font-medium">{invoice.total.toLocaleString('vi-VN')} VNĐ</TableCell>
                  <TableCell>{getPaymentStatusBadge(invoice.paymentStatus)}</TableCell>
                  <TableCell>{invoice.paymentMethod || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetail(invoice)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePrint(invoice)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Popup tạo hđ */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tạo hóa đơn mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bookingId">Mã đặt phòng</Label>
              <Input id="bookingId" placeholder="Ví dụ: BK001" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerId">Mã khách hàng</Label>
              <Input id="customerId" placeholder="Ví dụ: GU001" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoiceDate">Ngày lập</Label>
              <Input id="invoiceDate" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total">Tổng tiền (VNĐ)</Label>
              <Input id="total" type="number" placeholder="Ví dụ: 2000000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Phương thức thanh toán</Label>
              <Select>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Chọn phương thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="card">Thẻ ngân hàng</SelectItem>
                  <SelectItem value="transfer">Chuyển khoản</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentStatus">Trạng thái thanh toán</Label>
              <Select defaultValue="unpaid">
                <SelectTrigger id="paymentStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateInvoice}>Tạo hóa đơn</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup chi tiết hđ */}
      <Dialog open={isViewDetailOpen} onOpenChange={setIsViewDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết hóa đơn</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Mã hóa đơn</Label>
                  <p className="text-lg font-semibold">{selectedInvoice.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Trạng thái</Label>
                  <div className="mt-1">{getPaymentStatusBadge(selectedInvoice.paymentStatus)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Mã đặt phòng</Label>
                  <p className="text-lg font-semibold">{selectedInvoice.bookingId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Khách hàng</Label>
                  <p className="text-lg font-semibold">{selectedInvoice.guestName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ngày lập</Label>
                  <p className="text-lg font-semibold">{new Date(selectedInvoice.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tổng tiền</Label>
                  <p className="text-lg font-semibold">{selectedInvoice.total.toLocaleString('vi-VN')} VNĐ</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phương thức thanh toán</Label>
                  <p className="text-lg font-semibold">{selectedInvoice.paymentMethod}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup in hđ */}
      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Xem trước & In hóa đơn</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="border rounded-lg p-6 space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="text-xl font-bold">HÓA ĐƠN</h3>
                <p className="text-sm text-muted-foreground">Hệ thống Quản lý Khách sạn</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã hóa đơn:</span>
                  <span className="font-semibold">{selectedInvoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày lập:</span>
                  <span className="font-semibold">{new Date(selectedInvoice.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khách hàng:</span>
                  <span className="font-semibold">{selectedInvoice.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã đặt phòng:</span>
                  <span className="font-semibold">{selectedInvoice.bookingId}</span>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Tổng cộng:</span>
                  <span className="font-bold">{selectedInvoice.total.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrintOpen(false)}>Hủy</Button>
            <Button onClick={handleConfirmPrint}>In hóa đơn</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
