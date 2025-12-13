import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const handleSave = (section) => {
    toast({
      title: "Đã lưu",
      description: `Cài đặt ${section} đã được lưu thành công`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cài đặt</h1>
        <p className="text-muted-foreground">Quản lý cài đặt hệ thống và thông tin khách sạn</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin khách sạn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hotel-name">Tên khách sạn</Label>
              <Input id="hotel-name" placeholder="Hotel Management System" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hotel-address">Địa chỉ</Label>
              <Input id="hotel-address" placeholder="123 Đường ABC, Quận 1, TP.HCM" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hotel-phone">Số điện thoại</Label>
              <Input id="hotel-phone" placeholder="028 1234 5678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hotel-email">Email</Label>
              <Input id="hotel-email" type="email" placeholder="info@hotel.com" />
            </div>
            <Button className="w-full gap-2" onClick={() => handleSave("thông tin khách sạn")}>
              <Save className="h-4 w-4" />
              Lưu thay đổi
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cài đặt thời gian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="checkin-time">Giờ nhận phòng</Label>
              <Input id="checkin-time" type="time" defaultValue="14:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout-time">Giờ trả phòng</Label>
              <Input id="checkout-time" type="time" defaultValue="12:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Đơn vị tiền tệ</Label>
              <Input id="currency" defaultValue="VNĐ" disabled />
            </div>
            <Button className="w-full gap-2" onClick={() => handleSave("thời gian")}>
              <Save className="h-4 w-4" />
              Lưu thay đổi
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loại phòng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Standard</Label>
              <Input placeholder="500,000 VNĐ/đêm" />
            </div>
            <div className="space-y-2">
              <Label>Deluxe</Label>
              <Input placeholder="800,000 VNĐ/đêm" />
            </div>
            <div className="space-y-2">
              <Label>Suite</Label>
              <Input placeholder="1,500,000 VNĐ/đêm" />
            </div>
            <div className="space-y-2">
              <Label>Presidential</Label>
              <Input placeholder="3,000,000 VNĐ/đêm" />
            </div>
            <Button className="w-full gap-2" onClick={() => handleSave("loại phòng")}>
              <Save className="h-4 w-4" />
              Lưu thay đổi
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thuế và phí</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Thuế VAT (%)</Label>
              <Input id="tax-rate" type="number" defaultValue="10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-fee">Phí dịch vụ (%)</Label>
              <Input id="service-fee" type="number" defaultValue="5" />
            </div>
            <Button className="w-full gap-2" onClick={() => handleSave("thuế và phí")}>
              <Save className="h-4 w-4" />
              Lưu thay đổi
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
