"use client";

import { UserProfile } from "@/lib/rbac";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu, CheckCircle2 } from "lucide-react";

interface EnterpriseHeaderProps {
  userProfile: UserProfile;
  onMenuClick?: () => void;
}

export function EnterpriseHeader({ userProfile, onMenuClick }: EnterpriseHeaderProps) {
  const pathname = usePathname();

  // Create breadcrumbs based on pathname
  const pathParts = pathname.split("/").filter(Boolean);
  
  // Format breadcrumbs: ['super-admin', 'hospitals'] -> 'Platform / Hospitals'
  const breadcrumbs = pathParts.map((part, index) => {
    if (part === "super-admin") return "Platform";
    return part.charAt(0).toUpperCase() + part.slice(1);
  });

  if (breadcrumbs.length === 1) {
    breadcrumbs.push("Overview");
  }

  // Mobile page title is just the last breadcrumb
  const mobilePageTitle = breadcrumbs[breadcrumbs.length - 1];

  return (
    <div className="h-12 md:h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-3 md:px-4 sticky top-0 z-20 flex-shrink-0">
      {/* Left side: Mobile Menu Toggle & Title / Desktop Breadcrumbs */}
      <div className="flex items-center gap-3 md:gap-0">
        <button 
          className="md:hidden p-1.5 -ml-1.5 text-[#6B7280] hover:text-[#111827] rounded-md"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Title */}
        <h1 className="md:hidden text-[15px] font-semibold text-[#111827] truncate">
          {mobilePageTitle}
        </h1>

        {/* Desktop Breadcrumbs */}
        <div className="hidden md:flex items-center text-[13px]">
          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center">
              {idx > 0 && <span className="text-[#9CA3AF] mx-2">/</span>}
              <span className={idx === breadcrumbs.length - 1 ? "text-[#111827] font-medium" : "text-[#6B7280]"}>
                {crumb}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side Tools */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Environment Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-[11px] font-medium tracking-wide uppercase">
          <CheckCircle2 className="w-3 h-3" />
          Production
        </div>

        {/* Mobile Search Icon */}
        <button className="md:hidden p-1.5 text-[#6B7280] hover:text-[#111827] rounded-md transition-colors">
          <Search className="w-5 h-5" />
        </button>

        {/* Desktop Search Shell */}
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search className="h-[14px] w-[14px] text-[#9CA3AF]" />
          </div>
          <input
            type="text"
            className="block w-64 pl-8 pr-3 py-1.5 border border-[#E5E7EB] rounded-md leading-5 bg-[#FAFAFA] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-[13px] transition-colors"
            placeholder="Search hospitals, users, etc..."
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <span className="text-[#9CA3AF] text-[10px] font-mono border border-[#E5E7EB] rounded px-1.5 py-0.5 bg-white">
              ⌘K
            </span>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-md transition-colors">
          <Bell className="w-5 h-5 md:w-[18px] md:h-[18px]" />
          <span className="absolute top-1.5 right-1.5 md:top-1 md:right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Mobile User Avatar */}
        <div className="md:hidden flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-semibold ml-1">
          {userProfile?.name?.substring(0, 2).toUpperCase() || "SU"}
        </div>
      </div>
    </div>
  );
}
