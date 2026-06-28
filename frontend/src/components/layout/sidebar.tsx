"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Hotel, 
  Upload, 
  Settings, 
  Users, 
  CreditCard, 
  MessageSquare, 
  BarChart3,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Hotels", href: "/hotels", icon: Hotel },
  { name: "Bookings", href: "/bookings", icon: CreditCard },
  { name: "Vendor Management", href: "/admin/vendors", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-slate-950 text-slate-300 h-screen fixed left-0 top-0 border-r border-slate-800">
      <div className="p-6">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Aatomate Hotel Bot</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive 
                  ? "bg-slate-800 text-white" 
                  : "hover:bg-slate-900 hover:text-white"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-indigo-400" : "text-slate-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={() => {
            localStorage.removeItem("superAdminAuthToken");
            document.cookie = "super_admin_session=; Path=/; Max-Age=0; SameSite=Lax";
            window.location.href = "/super-admin/login";
          }}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-slate-400 hover:text-white transition-colors rounded-md hover:bg-slate-900"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
