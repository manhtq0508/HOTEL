import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Hotel, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleLogin = () => {
    if (username === "admin" && password === "123456") {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", username);
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay trở lại!",
      });
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } else {
      toast({
        title: "Đăng nhập thất bại",
        description: "Tên đăng nhập hoặc mật khẩu sai",
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = () => {
    if (resetEmail) {
      toast({
        title: "Yêu cầu đã được gửi",
        description: "Vui lòng kiểm tra email để đặt lại mật khẩu",
      });
      setIsForgotPasswordOpen(false);
      setResetEmail("");
    } else {
      toast({
        title: "Vui lòng nhập email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Hotel className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">Đăng nhập hệ thống</CardTitle>
            <CardDescription className="mt-2">
              Quản lý khách sạn - Hệ thống tích hợp
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <Button
                variant="link"
                className="px-0 text-sm"
                onClick={() => setIsForgotPasswordOpen(true)}
              >
                Quên mật khẩu?
              </Button>
            </div>
          </div>
          <Button className="w-full" size="lg" onClick={handleLogin}>
            Đăng nhập
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Demo: admin / 123456
          </div>
          <div className="border-t pt-4">
            <a href="/customer/login">
              <Button variant="outline" className="w-full">
                Cổng khách hàng
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quên mật khẩu</DialogTitle>
            <DialogDescription>
              Nhập email của bạn để nhận liên kết đặt lại mật khẩu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="example@hotel.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsForgotPasswordOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleForgotPassword}>Gửi yêu cầu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
