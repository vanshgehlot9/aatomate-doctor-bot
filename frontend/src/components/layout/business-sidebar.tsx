"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  Hotel, 
  MessageSquare, 
  UtensilsCrossed, 
  ConciergeBell, 
  Users, 
  Star, 
  TrendingUp, 
  Settings,
  LogOut,
  Bell,
  Search,
  UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/lib/api";

const navigation = [
  { name: "Overview", href: "/business", icon: LayoutDashboard },
  { name: "Bookings", href: "/business/bookings", icon: Calendar },
  { name: "Property", href: "/business/property", icon: Hotel },
  { name: "WhatsApp Center", href: "/business/whatsapp", icon: MessageSquare },
  { name: "Food & Dining", href: "/business/food", icon: UtensilsCrossed },
  { name: "Room Service", href: "/business/service", icon: ConciergeBell },
  { name: "Staff", href: "/business/staff", icon: Users },
  { name: "Reviews", href: "/business/reviews", icon: Star },
  { name: "Dynamic Pricing", href: "/business/pricing", icon: TrendingUp },
];

export function BusinessSidebar() {
  const pathname = usePathname();
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
  });

  return (
    <div className="flex flex-col w-72 bg-white text-slate-600 h-screen fixed left-0 top-0 border-r border-slate-100 z-50">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <Hotel className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-slate-900 font-bold text-lg tracking-tight leading-none">Aatomate Hotel Bot</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Business Edition</p>
          </div>
        </div>
      </div>

      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search everything..." 
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/business" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-indigo-50 text-indigo-600" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-100 space-y-4">
        <Link 
          href="/business/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-2 text-sm font-semibold rounded-xl transition-all",
            pathname === "/business/settings" ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <UserCircle className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 leading-none truncate max-w-[100px]">{user?.name || "Owner"}</span>
              <span className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest font-black truncate max-w-[100px]">{user?.role?.replace('_', ' ') || "Hotel Owner"}</span>
            </div>
          </div>
          <button 
            onClick={() => {
                localStorage.removeItem("businessAuthToken");
                document.cookie = "business_session=; Path=/; Max-Age=0; SameSite=Lax";
              window.location.href = "/business/login";
            }}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
