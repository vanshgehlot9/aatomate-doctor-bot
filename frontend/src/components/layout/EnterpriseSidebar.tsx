"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserProfile } from "@/lib/rbac";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  Activity,
  FileText,
  LifeBuoy,
  ListTodo,
  ShieldCheck,
  BarChart3,
  Sparkles,
  ServerCrash,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAVIGATION = [
  { group: "Core", items: [
    { name: "Platform Overview", href: "/super-admin", icon: LayoutDashboard },
    { name: "Hospitals", href: "/super-admin/hospitals", icon: Building2 },
    { name: "Users", href: "/super-admin/users", icon: Users },
  ]},
  { group: "Revenue", items: [
    { name: "Subscriptions", href: "/super-admin/subscriptions", icon: ListTodo },
  ]},
  { group: "Operations", items: [
    { name: "Support Tickets", href: "/super-admin/support", icon: LifeBuoy },
    { name: "Analytics", href: "/super-admin/analytics", icon: BarChart3 },
  ]}
];

interface EnterpriseSidebarProps {
  userProfile: UserProfile;
  isOpen?: boolean;
  onClose?: () => void;
}

export function EnterpriseSidebar({ userProfile, isOpen, onClose }: EnterpriseSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Close sidebar on navigation in mobile
  useEffect(() => {
    if (isOpen && onClose) onClose();
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#111827]/20 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <div 
        className={cn(
          "flex flex-col bg-[#FAFAFA] border-r border-[#E5E7EB] h-screen fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out md:translate-x-0",
          collapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-12 md:h-14 flex items-center justify-between px-4 border-b border-[#E5E7EB] flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 overflow-hidden">
                <Image 
                  src="/aatomate.jpeg" 
                  alt="Aatomate" 
                  width={22} 
                  height={22} 
                  className="object-contain mix-blend-multiply flex-shrink-0"
                />
                <span className="font-semibold text-[13px] text-[#111827] tracking-tight">
                  Aatomate <span className="text-[#6B7280] font-normal">Platform</span>
                </span>
              </div>
              <button onClick={onClose} className="md:hidden p-1 text-[#6B7280] hover:bg-[#F3F4F6] rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {collapsed && (
            <div className="flex w-full justify-center">
              <Image 
                src="/aatomate.jpeg" 
                alt="Aatomate" 
                width={20} 
                height={20} 
                className="object-contain mix-blend-multiply"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 md:py-4 scrollbar-hide">
          {NAVIGATION.map((group, idx) => (
            <div key={group.group} className={cn("mb-5 md:mb-6", collapsed ? "px-2" : "px-3")}>
              {!collapsed && (
                <h4 className="text-[10px] md:text-[11px] font-medium text-[#6B7280] uppercase tracking-wider mb-2 px-2">
                  {group.group}
                </h4>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/super-admin" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        "flex items-center gap-3 px-2 py-2 md:py-1.5 rounded-md text-[13px] transition-colors relative group active:scale-[0.98]",
                        isActive 
                          ? "bg-blue-50 text-blue-600 font-medium" 
                          : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-blue-600 rounded-r-full" />
                      )}
                      <item.icon className={cn("w-[18px] h-[18px] flex-shrink-0", isActive ? "text-blue-600" : "text-[#6B7280]")} />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#E5E7EB] p-3 flex-shrink-0 bg-white">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-2")}>
            {!collapsed && (
              <div className="flex items-center gap-2 overflow-hidden flex-1 px-1">
                <Avatar className="w-8 h-8 rounded-md border border-[#E5E7EB]">
                  <AvatarFallback className="bg-[#F3F4F6] text-[#111827] text-xs rounded-md font-medium">
                    {userProfile.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="truncate">
                  <p className="text-[13px] font-medium text-[#111827] truncate">{userProfile.name}</p>
                  <p className="text-[11px] text-[#6B7280] truncate capitalize">{userProfile.activeRole.replace("_", " ")}</p>
                </div>
              </div>
            )}
            
            <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "gap-1")}>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-[#6B7280] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Sign out"
              >
                <LogOut className="w-[18px] h-[18px]" />
              </button>
              <button 
                onClick={() => setCollapsed(!collapsed)}
                className="p-1.5 text-[#6B7280] hover:bg-[#F3F4F6] rounded-md transition-colors hidden md:block"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronRight className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
