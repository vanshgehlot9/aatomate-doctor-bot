"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, User, LogOut, Menu } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileSidebarContent } from "./DynamicSidebar";
import { UserProfile, getRoleDisplayName } from "@/lib/rbac";
import { RoleSwitcher } from "./RoleSwitcher";
import { supabase } from "@/lib/supabase";

export function Topbar({ userProfile }: { userProfile: UserProfile }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    const ALL_COOKIES = ["vendor_session", "business_session", "staff_session", "super_admin_session", "doctor_session"];
    for (const cookie of ALL_COOKIES) {
      document.cookie = `${cookie}=; path=/; max-age=0`;
    }
    localStorage.removeItem("tenantId");
    localStorage.removeItem("activeRole");
    router.push("/login");
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center flex-1 gap-2 md:gap-0">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger className="md:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-md cursor-pointer">
            <Menu className="w-5 h-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[85vw] sm:max-w-[400px] border-r-0">
            <MobileSidebarContent userProfile={userProfile} onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
        
        <div className="relative w-full max-w-sm hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search patients, doctors, or reports (Ctrl+K)" 
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Switcher — only shows when user has multiple roles */}
        <RoleSwitcher />

        <button className="p-2 hover:bg-muted rounded-full text-muted-foreground relative transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <div className="flex items-center gap-3 pl-3 border-l border-border ml-1">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-foreground leading-none">{userProfile.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{getRoleDisplayName(userProfile.activeRole)}</p>
              </div>
              <Avatar className="w-9 h-9 ring-2 ring-primary/10">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {userProfile.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
