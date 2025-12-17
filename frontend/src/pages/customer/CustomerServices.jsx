import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Utensils, Shirt, Plane, Car, Sparkles, Plus, Clock, CheckCircle, Loader2 } from "lucide-react";
import { mockServiceRequests, serviceTypes, mockOnlineBookings } from "@/mock/customerMockData";

const serviceIcons = {
  room_service: Utensils,
  laundry: Shirt,
  airport_transfer: Plane,
  vehicle_rental: Car,
  spa: Sparkles,
};

const servicePrices = {
  room_service: 150000,
  laundry: 50000,
  airport_transfer: 300000,
  vehicle_rental: 150000,
  spa: 500000,
};

export default function CustomerServices() {
  const customerId = localStorage.getItem("customerId");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [description, setDescription] = useState("");
  const [selectedBooking, setSelectedBooking] = useState("");

  const myRequests = mockServiceRequests.filter(r => r.customerId === customerId);
  const myBookings = mockOnlineBookings.filter(b => b.customerId === customerId && ["confirmed", "checked_in"].includes(b.status));

  const pendingRequests = myRequests.filter(r => r.status === "pending");
  const inProgressRequests = myRequests.filter(r => r.status === "in_progress");
  const completedRequests = myRequests.filter(r => r.status === "completed");

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "Chờ xử lý", variant: "outline", icon: Clock },
      in_progress: { label: "Đang xử lý", variant: "secondary", icon: Loader2 },
      completed: { label: "Hoàn thành", variant: "default", icon: CheckCircle },
    };
    const info = statusMap[status] || { label: status, variant: "outline" };
    const Icon = info.icon;
    return (
      <Badge variant={info.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {info.label}
      </Badge>
    );
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setDescription("");
    setSelectedBooking("");
    setRequestDialogOpen(true);
  };

  const handleSubmitRequest = () => {
    if (!selectedBooking) {
      toast({
        title: "Vui lòng chọn đặt phòng",
        description: "Bạn cần chọn đặt phòng liên quan đến yêu cầu dịch vụ",
        variant: "destructive",
      });
      return;
    }
    if (!description.trim()) {
      toast({
        title: "Vui lòng nhập mô tả",
        description: "Mô tả chi tiết yêu cầu của bạn",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Yêu cầu đã được gửi",
      description: "Chúng tôi sẽ xử lý yêu cầu của bạn trong thời gian sớm nhất",
    });
    setRequestDialogOpen(false);
  };

  const ServiceCard = ({ service }) => {
    const Icon = serviceIcons[service.id] || Utensils;
    const price = servicePrices[service.id];
    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
        onClick={() => handleServiceClick(service)}
      >
        <CardHeader className="pb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg">{service.name}</CardTitle>
          <CardDescription>{service.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Từ</span>
            <span className="font-bold text-primary">{price.toLocaleString()} VNĐ</span>
          </div>
          <Button className="w-full mt-4" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Yêu cầu dịch vụ
          </Button>
        </CardContent>
      </Card>
    );
  };

  const RequestItem = ({ request }) => {
    const Icon = serviceIcons[request.serviceType] || Utensils;
    return (
      <div className="flex items-start gap-4 p-4 border rounded-lg">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-start">
            <h4 className="font-medium">{request.serviceName}</h4>
            {getStatusBadge(request.status)}
          </div>
          <p className="text-sm text-muted-foreground">{request.description}</p>
          <div className="flex justify-between items-center pt-2 text-sm">
            <span className="text-muted-foreground">
              {new Date(request.createdAt).toLocaleDateString("vi-VN")}
            </span>
            <span className="font-medium">{request.amount.toLocaleString()} VNĐ</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dịch vụ khách sạn</h1>
        <p className="text-muted-foreground">Yêu cầu các dịch vụ bổ sung trong thời gian lưu trú</p>
      </div>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Danh sách dịch vụ</TabsTrigger>
          <TabsTrigger value="requests">
            Yêu cầu của tôi
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-6">
          {myBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Bạn cần có đặt phòng đang hoạt động để yêu cầu dịch vụ
                </p>
                <Button className="mt-4" onClick={() => window.location.href = "/customer/booking"}>
                  Đặt phòng ngay
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {serviceTypes.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-6 space-y-6">
          {/* Pending */}
          {pendingRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Đang chờ xử lý ({pendingRequests.length})
              </h3>
              <div className="space-y-3">
                {pendingRequests.map(request => (
                  <RequestItem key={request.id} request={request} />
                ))}
              </div>
            </div>
          )}

          {/* In Progress */}
          {inProgressRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Loader2 className="h-4 w-4" />
                Đang xử lý ({inProgressRequests.length})
              </h3>
              <div className="space-y-3">
                {inProgressRequests.map(request => (
                  <RequestItem key={request.id} request={request} />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Đã hoàn thành ({completedRequests.length})
              </h3>
              <div className="space-y-3">
                {completedRequests.map(request => (
                  <RequestItem key={request.id} request={request} />
                ))}
              </div>
            </div>
          )}

          {myRequests.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Bạn chưa có yêu cầu dịch vụ nào</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yêu cầu dịch vụ: {selectedService?.name}</DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết về yêu cầu của bạn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Đặt phòng liên quan</Label>
              <Select value={selectedBooking} onValueChange={setSelectedBooking}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đặt phòng" />
                </SelectTrigger>
                <SelectContent>
                  {myBookings.map(booking => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.id} - Phòng {booking.roomType} ({booking.checkInDate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mô tả chi tiết</Label>
              <Textarea 
                placeholder="Ví dụ: Đặt bữa sáng lên phòng lúc 7h sáng, 2 phần..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex justify-between">
                <span>Giá tham khảo:</span>
                <span className="font-medium">
                  {selectedService && servicePrices[selectedService.id]?.toLocaleString()} VNĐ
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                * Giá cuối cùng có thể thay đổi tùy theo yêu cầu cụ thể
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmitRequest}>Gửi yêu cầu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
