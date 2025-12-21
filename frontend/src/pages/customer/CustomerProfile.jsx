import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, CreditCard } from "lucide-react";
import { mockCustomerAccounts } from "@/mock/customerMockData";

export default function CustomerProfile() {
  const customerId = localStorage.getItem("customerId");
  const customer = mockCustomerAccounts.find(c => c.id === customerId) || {};
  
  const [formData, setFormData] = useState({
    name: customer.name || "",
    email: customer.email || "",
    phone: customer.phone || "",
    idNumber: customer.idNumber || "",
    address: customer.address || "",
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    toast({ title: "Đã cập nhật thông tin", description: "Thông tin cá nhân đã được lưu" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Thông tin cá nhân</h1>
        <p className="text-muted-foreground">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNumber">CCCD/Hộ chiếu</Label>
              <Input id="idNumber" name="idNumber" value={formData.idNumber} onChange={handleChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input id="address" name="address" value={formData.address} onChange={handleChange} />
          </div>
          <Button onClick={handleSave}>Lưu thay đổi</Button>
        </CardContent>
      </Card>
    </div>
  );
}
