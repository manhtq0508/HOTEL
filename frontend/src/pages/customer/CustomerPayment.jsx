import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { CreditCard, Banknote, Smartphone, Download, CheckCircle } from "lucide-react";
import { mockOnlineBookings, mockCustomerPayments, paymentMethods } from "@/mock/customerMockData";

export default function CustomerPayment() {
  const customerId = localStorage.getItem("customerId");
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentType, setPaymentType] = useState("deposit");

  const myBookings = mockOnlineBookings.filter(b => b.customerId === customerId);
  const myPayments = mockCustomerPayments.filter(p => p.customerId === customerId);

  const unpaidBookings = myBookings.filter(b => b.status === "pending" || (b.depositPaid < b.totalAmount * 0.3));

  const handlePayClick = (booking) => {
    setSelectedBooking(booking);
    setPayDialogOpen(true);
  };

  const handleConfirmPayment = () => {
    toast({
      title: "Thanh toán thành công",
      description: "Cảm ơn bạn đã thanh toán!",
    });
    setPayDialogOpen(false);
  };

  const getMethodIcon = (method) => {
    if (method === "cash") return Banknote;
    if (["momo", "vnpay"].includes(method)) return Smartphone;
    return CreditCard;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Thanh toán</h1>
        <p className="text-muted-foreground">Quản lý thanh toán và hóa đơn</p>
      </div>

      {/* Chờ thanh toán */}
      {unpaidBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cần thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {unpaidBookings.map(booking => (
              <div key={booking.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Đặt phòng {booking.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.checkInDate} - {booking.checkOutDate}
                  </p>
                  <p className="text-sm">Tổng: <strong>{booking.totalAmount.toLocaleString()} VNĐ</strong></p>
                </div>
                <Button onClick={() => handlePayClick(booking)}>Thanh toán</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lịch sử thanh toán */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
          {myPayments.length > 0 ? (
            <div className="space-y-4">
              {myPayments.map(payment => {
                const Icon = getMethodIcon(payment.method);
                return (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.type === "deposit" ? "Đặt cọc" : "Thanh toán"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">{payment.amount.toLocaleString()} VNĐ</p>
                      <Badge variant="outline" className="gap-1">
                        <Icon className="h-3 w-3" />
                        {paymentMethods.find(m => m.id === payment.method)?.name}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">Chưa có giao dịch nào</p>
          )}
        </CardContent>
      </Card>

      {/* Popup thanh toán */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thanh toán</DialogTitle>
            <DialogDescription>Chọn hình thức thanh toán</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Loại thanh toán</Label>
                <RadioGroup value={paymentType} onValueChange={setPaymentType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="deposit" id="deposit" />
                    <Label htmlFor="deposit">Đặt cọc (30%): {Math.round(selectedBooking.totalAmount * 0.3).toLocaleString()} VNĐ</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full">Thanh toán toàn bộ: {selectedBooking.totalAmount.toLocaleString()} VNĐ</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Phương thức thanh toán</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {paymentMethods.map(method => (
                    <div key={method.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label htmlFor={method.id}>{method.name}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleConfirmPayment}>Xác nhận thanh toán</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
