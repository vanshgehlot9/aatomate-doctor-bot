"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@/lib/rbac";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  Activity,
  FileText,
  Calendar,
  Pill,
  Microscope,
  Stethoscope,
  LogOut
} from "lucide-react";

import { UserProfile } from "@/lib/rbac";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getTenants } from "@/lib/api";

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
}

const getNavigationByRole = (role: Role): SidebarItem[] => {
  switch (role) {
    case Role.SUPER_ADMIN:
      return [
        { name: "Platform Overview", href: "/super-admin", icon: LayoutDashboard },
        { name: "Hospitals", href: "/super-admin/hospitals", icon: Building2 },
        { name: "Users", href: "/super-admin/users", icon: Users },
      ];
    case Role.HOSPITAL_ADMIN:
      return [
        { name: "Hospital Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Doctors", href: "/admin/doctors", icon: Stethoscope },
        { name: "Staff", href: "/admin/staff", icon: Users },
      ];
    case Role.DOCTOR:
      return [
        { name: "My Dashboard", href: "/doctor", icon: LayoutDashboard },
        { name: "Appointments", href: "/doctor/appointments", icon: Calendar },
        { name: "Patients", href: "/doctor/patients", icon: Users },
        { name: "Prescriptions", href: "/doctor/prescriptions", icon: Pill },
      ];
    case Role.RECEPTIONIST:
    case Role.STAFF:
      return [
        { name: "Dashboard", href: "/staff", icon: LayoutDashboard },
        { name: "Appointments", href: "/staff/appointments", icon: Calendar },
        { name: "Walk-in Queue", href: "/staff/queue", icon: Activity },
      ];
    case Role.NURSE:
      return [
        { name: "Dashboard", href: "/staff", icon: LayoutDashboard },
        { name: "Patient Vitals", href: "/staff/vitals", icon: Activity },
        { name: "Doctor Queue", href: "/staff/queue", icon: Users },
      ];
    case Role.LAB_TECHNICIAN:
      return [
        { name: "Dashboard", href: "/staff", icon: LayoutDashboard },
        { name: "Pending Tests", href: "/staff/tests", icon: Microscope },
        { name: "Reports", href: "/staff/reports", icon: FileText },
      ];
    case Role.PHARMACIST:
      return [
        { name: "Dashboard", href: "/staff", icon: LayoutDashboard },
        { name: "Prescriptions", href: "/staff/prescriptions", icon: Pill },
        { name: "Inventory", href: "/staff/inventory", icon: Building2 },
      ];
    case Role.BILLING_EXECUTIVE:
      return [
        { name: "Dashboard", href: "/staff", icon: LayoutDashboard },
        { name: "Invoices", href: "/staff/invoices", icon: FileText },
        { name: "Payments", href: "/staff/payments", icon: CreditCard },
      ];
    default:
      return [];
  }
};

export function SidebarContent({ userProfile, onNavigate }: { userProfile: UserProfile, onNavigate?: () => void }) {
  const pathname = usePathname();
  const navigation = getNavigationByRole(userProfile.role);

  const { data: tenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: getTenants,
    enabled: userProfile.tenantId !== "global"
  });
  
  const hospitalName = tenants?.find(t => t.id === userProfile.tenantId)?.hospital_name;

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-4 flex-shrink-0 border-b border-sidebar-border/50 bg-background/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-2 py-1">
          <Image 
            src="/aatomate.jpeg" 
            alt="Aatomate Logo" 
            width={110} 
            height={40} 
            className="object-contain mix-blend-multiply dark:mix-blend-normal"
          />
          {hospitalName && (
            <div className="mt-1 text-center w-full bg-primary/5 px-2 py-1.5 rounded-md border border-primary/10">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Hospital</span>
              <p className="text-sm font-bold text-foreground truncate" title={hospitalName}>{hospitalName}</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary font-semibold" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border flex-shrink-0">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function DynamicSidebar({ userProfile }: { userProfile: UserProfile }) {
  return (
    <div className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground h-screen fixed left-0 top-0 border-r border-sidebar-border shadow-sm z-30">
      <SidebarContent userProfile={userProfile} />
    </div>
  );
}
