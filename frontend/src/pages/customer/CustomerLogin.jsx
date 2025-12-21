import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Hotel, Eye, EyeOff } from "lucide-react";
import { mockCustomerAccounts } from "@/mock/customerMockData";

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    const customer = mockCustomerAccounts.find(
      c => c.email === email && c.password === password
    );
    
    if (customer) {
      localStorage.setItem("isCustomerLoggedIn", "true");
      localStorage.setItem("customerId", customer.id);
      localStorage.setItem("customerName", customer.name);
      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng ${customer.name}!`,
      });
      setTimeout(() => {
        navigate("/customer");
      }, 500);
    } else {
      toast({
        title: "Đăng nhập thất bại",
        description: "Email hoặc mật khẩu không đúng",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
            <Hotel className="w-8 h-8 text-secondary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">Cổng khách hàng</CardTitle>
            <CardDescription className="mt-2">
              Đăng nhập để quản lý đặt phòng của bạn
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <Button className="w-full" size="lg" onClick={handleLogin}>
            Đăng nhập
          </Button>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link to="/customer/register" className="text-secondary hover:underline font-medium">
                Đăng ký ngay
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              Demo: nguyenvanan@email.com / customer123
            </p>
          </div>
          <div className="border-t pt-4">
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Đăng nhập Admin
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
