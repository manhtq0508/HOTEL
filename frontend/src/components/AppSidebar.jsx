import { NavLink } from "react-router-dom";
import { LayoutDashboard, Bed, CalendarCheck, Users, FileText, Utensils, Wrench, UserCog, BarChart3, Settings, Hotel } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader } from "@/components/ui/sidebar";

const menuItems = [
  { title: "Tổng quan", url: "/", icon: LayoutDashboard },
  { title: "Phòng", url: "/rooms", icon: Bed },
  { title: "Đặt phòng", url: "/bookings", icon: CalendarCheck },
  { title: "Khách hàng", url: "/guests", icon: Users },
  { title: "Hóa đơn", url: "/invoices", icon: FileText },
  { title: "Dịch vụ", url: "/services", icon: Utensils },
  { title: "Bảo trì", url: "/maintenance", icon: Wrench },
  { title: "Nhân viên", url: "/staff", icon: UserCog },
  { title: "Báo cáo", url: "/reports", icon: BarChart3 },
  { title: "Cài đặt", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-4 bg-sidebar">
        <div className="flex items-center gap-2">
          <Hotel className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">Khách sạn Hortensia</h2>
            <p className="text-xs text-sidebar-foreground/70">Quản lý khách sạn</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 px-3">Menu chính</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive 
                            ? "bg-primary text-white font-medium shadow-sm" 
                            : "text-sidebar-foreground/80 hover:bg-primary/20 hover:text-sidebar-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
