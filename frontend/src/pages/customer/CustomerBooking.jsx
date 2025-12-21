import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Bed, Users, Calendar, Check, Wifi, Tv, Wind, Wine, Bath, Mountain } from "lucide-react";
import { mockRooms } from "@/mock/mockData";

const roomTypeInfo = {
  Standard: { 
    price: 500000, 
    description: "Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản",
    amenities: ["WiFi", "TV", "Điều hòa"],
    maxGuests: 2
  },
  Deluxe: { 
    price: 800000, 
    description: "Phòng cao cấp với không gian rộng rãi và minibar",
    amenities: ["WiFi", "TV", "Điều hòa", "Mini bar"],
    maxGuests: 3
  },
  Suite: { 
    price: 1500000, 
    description: "Phòng suite sang trọng với phòng khách riêng",
    amenities: ["WiFi", "TV", "Điều hòa", "Mini bar", "Bồn tắm", "Ban công"],
    maxGuests: 4
  },
  Presidential: { 
    price: 3000000, 
    description: "Phòng Tổng thống - Trải nghiệm đẳng cấp nhất",
    amenities: ["WiFi", "TV", "Điều hòa", "Mini bar", "Bồn tắm", "Ban công", "Phòng khách", "Bếp"],
    maxGuests: 6
  },
};

const amenityIcons = {
  WiFi: Wifi,
  TV: Tv,
  "Điều hòa": Wind,
  "Mini bar": Wine,
  "Bồn tắm": Bath,
  "Ban công": Mountain,
};

export default function CustomerBooking() {
  const [step, setStep] = useState(1);
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("2");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Kiểm tra phòng
  const availableRooms = mockRooms.filter(
    r => r.status === "available" && r.type === selectedRoomType
  );

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const nights = calculateNights();
  const roomInfo = roomTypeInfo[selectedRoomType];
  const totalAmount = roomInfo ? roomInfo.price * nights : 0;
  const depositAmount = Math.round(totalAmount * 0.3);

  const validateStep1 = () => {
    if (!selectedRoomType) {
      toast({ title: "Vui lòng chọn loại phòng", variant: "destructive" });
      return false;
    }
    if (!numberOfGuests) {
      toast({ title: "Vui lòng chọn số khách", variant: "destructive" });
      return false;
    }
    if (roomInfo && parseInt(numberOfGuests) > roomInfo.maxGuests) {
      toast({ 
        title: "Số khách vượt quá giới hạn", 
        description: `Phòng ${selectedRoomType} tối đa ${roomInfo.maxGuests} khách`,
        variant: "destructive" 
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!checkInDate) {
      toast({ title: "Vui lòng chọn ngày nhận phòng", variant: "destructive" });
      return false;
    }
    if (!checkOutDate) {
      toast({ title: "Vui lòng chọn ngày trả phòng", variant: "destructive" });
      return false;
    }
    if (new Date(checkInDate) < new Date()) {
      toast({ title: "Ngày nhận phòng phải từ hôm nay trở đi", variant: "destructive" });
      return false;
    }
    if (nights <= 0) {
      toast({ title: "Ngày trả phòng phải sau ngày nhận phòng", variant: "destructive" });
      return false;
    }
    if (availableRooms.length === 0) {
      toast({ title: "Không có phòng trống cho loại phòng này", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleConfirmBooking = () => {
    toast({
      title: "Đặt phòng thành công!",
      description: "Chúng tôi sẽ xác nhận đặt phòng của bạn trong thời gian sớm nhất",
    });
    setConfirmDialogOpen(false);
    // Reset form
    setStep(1);
    setSelectedRoomType("");
    setNumberOfGuests("2");
    setCheckInDate("");
    setCheckOutDate("");
    setNotes("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Đặt phòng trực tuyến</h1>
        <p className="text-muted-foreground">Chọn loại phòng và ngày lưu trú</p>
      </div>

      {/* Tiến trình */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {step > s ? <Check className="h-5 w-5" /> : s}
            </div>
            <span className={`ml-2 text-sm hidden md:inline ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
              {s === 1 ? "Chọn phòng" : s === 2 ? "Chọn ngày" : "Xác nhận"}
            </span>
            {s < 3 && <div className={`w-12 h-1 mx-4 rounded ${step > s ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {/* Bước chọn phòng */}
      {step === 1 && (
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(roomTypeInfo).map(([type, info]) => (
            <Card 
              key={type}
              className={`cursor-pointer transition-all ${
                selectedRoomType === type 
                  ? "ring-2 ring-primary shadow-lg" 
                  : "hover:shadow-md"
              }`}
              onClick={() => setSelectedRoomType(type)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bed className="h-5 w-5" />
                      Phòng {type}
                    </CardTitle>
                    <CardDescription>{info.description}</CardDescription>
                  </div>
                  {selectedRoomType === type && (
                    <Badge className="bg-primary">Đã chọn</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {info.amenities.map((amenity) => {
                    const Icon = amenityIcons[amenity] || Wifi;
                    return (
                      <Badge key={amenity} variant="outline" className="gap-1">
                        <Icon className="h-3 w-3" />
                        {amenity}
                      </Badge>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" /> Tối đa {info.maxGuests} khách
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {info.price.toLocaleString()} VNĐ/đêm
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bước chọn ngày */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Chọn ngày lưu trú</CardTitle>
            <CardDescription>Phòng {selectedRoomType} - {roomInfo?.price.toLocaleString()} VNĐ/đêm</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="checkin">Ngày nhận phòng</Label>
                <Input 
                  id="checkin"
                  type="date" 
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout">Ngày trả phòng</Label>
                <Input 
                  id="checkout"
                  type="date" 
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  min={checkInDate || new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">Số khách</Label>
                <Select value={numberOfGuests} onValueChange={setNumberOfGuests}>
                  <SelectTrigger id="guests">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(roomInfo?.maxGuests || 2)].map((_, i) => (
                      <SelectItem key={i+1} value={String(i+1)}>{i+1} khách</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {nights > 0 && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Số đêm:</span>
                  <span className="font-medium">{nights} đêm</span>
                </div>
                <div className="flex justify-between">
                  <span>Phòng trống:</span>
                  <span className="font-medium text-success">{availableRooms.length} phòng</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Tổng tiền:</span>
                  <span className="text-primary">{totalAmount.toLocaleString()} VNĐ</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
              <Textarea 
                id="notes"
                placeholder="Yêu cầu đặc biệt (view phòng, tầng cao, v.v.)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bước xác nhận */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Xác nhận đặt phòng</CardTitle>
            <CardDescription>Vui lòng kiểm tra lại thông tin đặt phòng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold">Thông tin phòng</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loại phòng:</span>
                    <span className="font-medium">Phòng {selectedRoomType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số khách:</span>
                    <span className="font-medium">{numberOfGuests} khách</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giá phòng:</span>
                    <span className="font-medium">{roomInfo?.price.toLocaleString()} VNĐ/đêm</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">Thời gian lưu trú</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nhận phòng:</span>
                    <span className="font-medium">{checkInDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trả phòng:</span>
                    <span className="font-medium">{checkOutDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số đêm:</span>
                    <span className="font-medium">{nights} đêm</span>
                  </div>
                </div>
              </div>
            </div>

            {notes && (
              <div className="space-y-2">
                <h3 className="font-semibold">Ghi chú</h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{notes}</p>
              </div>
            )}

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tiền phòng ({nights} đêm):</span>
                <span>{totalAmount.toLocaleString()} VNĐ</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Đặt cọc (30%):</span>
                <span>{depositAmount.toLocaleString()} VNĐ</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary/20">
                <span>Tổng thanh toán:</span>
                <span className="text-primary">{totalAmount.toLocaleString()} VNĐ</span>
              </div>
            </div>

            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning-foreground">
                 <strong>Lưu ý:</strong> Đặt phòng sẽ được giữ trong 24 giờ. Vui lòng thanh toán đặt cọc để xác nhận đặt phòng.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nút navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setStep(prev => prev - 1)}
          disabled={step === 1}
        >
          Quay lại
        </Button>
        {step < 3 ? (
          <Button onClick={handleNext}>Tiếp tục</Button>
        ) : (
          <Button onClick={() => setConfirmDialogOpen(true)}>Xác nhận đặt phòng</Button>
        )}
      </div>

      {/* Popup xác nhận đặt phòng */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đặt phòng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn đặt phòng {selectedRoomType} từ {checkInDate} đến {checkOutDate}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleConfirmBooking}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
