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
  LogOut,
  BadgeCheck
} from "lucide-react";

import { UserProfile } from "@/lib/rbac";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getTenants } from "@/lib/api";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

export function MobileSidebarContent({ userProfile, onNavigate }: { userProfile: UserProfile, onNavigate?: () => void }) {
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

  // Framer motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const footerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.4 } }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-card text-foreground overflow-hidden">
      {/* Header */}
      <div className="p-6 flex-shrink-0 bg-card border-b border-border shadow-sm relative z-10">
        <div className="flex items-center justify-center mb-6">
          <Image 
            src="/aatomate.jpeg" 
            alt="Aatomate Logo" 
            width={120} 
            height={44} 
            className="object-contain mix-blend-multiply dark:mix-blend-normal"
          />
        </div>
        
        <div className="flex flex-col items-center text-center">
          <h3 className="font-bold text-lg flex items-center gap-1.5 text-foreground">
            {userProfile.name}
            <BadgeCheck className="w-4 h-4 text-blue-500" />
          </h3>
          <p className="text-sm font-medium text-muted-foreground capitalize mt-0.5">
            {userProfile.role.replace("_", " ")}
          </p>
          {hospitalName && (
            <div className="mt-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-900/50">
              <Building2 className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{hospitalName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <motion.nav 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 px-4 py-6 space-y-2 overflow-y-auto"
      >
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <motion.div key={item.name} variants={itemVariants}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="block outline-none"
              >
                <motion.div
                  whileHover={{ y: -2, scale: 0.99 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-[20px] transition-all duration-300 relative overflow-hidden group border",
                    isActive 
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50 shadow-sm text-blue-700 dark:text-blue-400 font-semibold" 
                      : "bg-transparent border-transparent text-muted-foreground hover:bg-white dark:hover:bg-muted/50 hover:shadow-sm hover:border-border/50 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav-indicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full"
                    />
                  )}
                  
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors relative z-10",
                    isActive ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                  )}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  
                  <span className="flex-1 text-[15px] relative z-10">{item.name}</span>
                  
                  {/* Mock badges for specific items */}
                  {item.name === "Reports" && (
                    <span className="w-2 h-2 rounded-full bg-red-500 relative z-10"></span>
                  )}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>

      {/* Footer */}
      <motion.div 
        variants={footerVariants}
        initial="hidden"
        animate="show"
        className="p-4 mt-auto border-t border-border/50 bg-white dark:bg-card relative z-10"
      >
        <div className="bg-slate-50 dark:bg-muted/30 p-3 rounded-[20px] border border-border/50 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="w-10 h-10 ring-2 ring-background shadow-sm border border-border/50">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {userProfile.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="truncate">
              <p className="text-sm font-bold text-foreground truncate">{userProfile.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/20"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
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
