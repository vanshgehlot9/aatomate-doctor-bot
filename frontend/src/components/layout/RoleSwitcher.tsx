"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Role, getRoleDisplayName, getRoleColors, canSwitchRoles } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Check,
  ArrowRightLeft,
  LayoutDashboard,
  Stethoscope,
  Users,
  Building2,
  Activity,
  Microscope,
  Pill,
  CreditCard,
  ShieldCheck,
  Loader2,
} from "lucide-react";

// Map roles to their icons
const ROLE_ICONS: Record<Role, React.ElementType> = {
  [Role.SUPER_ADMIN]: ShieldCheck,
  [Role.HOSPITAL_ADMIN]: Building2,
  [Role.DOCTOR]: Stethoscope,
  [Role.STAFF]: Users,
  [Role.RECEPTIONIST]: LayoutDashboard,
  [Role.NURSE]: Activity,
  [Role.LAB_TECHNICIAN]: Microscope,
  [Role.PHARMACIST]: Pill,
  [Role.BILLING_EXECUTIVE]: CreditCard,
};

/**
 * Role Switcher — Desktop dropdown component.
 * Shows the current active role with a dropdown to switch between roles.
 * Only renders if the user has multiple roles.
 */
export function RoleSwitcher() {
  const { userProfile, switchRole, switching } = useAuth();
  const [open, setOpen] = useState(false);

  if (!userProfile || !canSwitchRoles(userProfile)) {
    return null;
  }

  const activeColors = getRoleColors(userProfile.activeRole);
  const ActiveIcon = ROLE_ICONS[userProfile.activeRole] || LayoutDashboard;

  const handleSwitch = async (role: Role) => {
    if (role === userProfile.activeRole) return;
    setOpen(false);
    try {
      await switchRole(role);
      toast.success(`Switched to ${getRoleDisplayName(role)}`, {
        description: "Your permissions and dashboard have been updated.",
        duration: 3000,
      });
    } catch {
      toast.error("Failed to switch role", {
        description: "Please try again or contact support.",
      });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
          "border cursor-pointer outline-none",
          "hover:shadow-sm active:scale-[0.98]",
          activeColors.bg, activeColors.text, activeColors.border
        )}
        disabled={switching}
      >
        {switching ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ActiveIcon className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">{getRoleDisplayName(userProfile.activeRole)}</span>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 transition-transform duration-200",
          open && "rotate-180"
        )} />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 p-1.5"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <ArrowRightLeft className="w-3 h-3" />
            Switch Role
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />

        {userProfile.roles.map((role) => {
          const isActive = role === userProfile.activeRole;
          const colors = getRoleColors(role);
          const RoleIcon = ROLE_ICONS[role] || LayoutDashboard;

          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleSwitch(role)}
              disabled={switching}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150",
                isActive
                  ? `${colors.bg} ${colors.text} font-semibold`
                  : "text-foreground hover:bg-muted"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                isActive
                  ? `${colors.bg} ${colors.text}`
                  : "bg-muted text-muted-foreground"
              )}>
                <RoleIcon className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none">
                  {getRoleDisplayName(role)}
                </p>
                {isActive && (
                  <p className="text-[10px] mt-0.5 opacity-70">Currently active</p>
                )}
              </div>

              {isActive && (
                <Check className="w-4 h-4 shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


/**
 * Mobile Role Switcher — Segmented pill UI for mobile sidebar/drawer.
 * Shows a compact, touch-friendly role switcher.
 */
export function MobileRoleSwitcher() {
  const { userProfile, switchRole, switching } = useAuth();

  if (!userProfile || !canSwitchRoles(userProfile)) {
    return null;
  }

  const handleSwitch = async (role: Role) => {
    if (role === userProfile.activeRole || switching) return;
    try {
      await switchRole(role);
      toast.success(`Switched to ${getRoleDisplayName(role)}`);
    } catch {
      toast.error("Failed to switch role");
    }
  };

  return (
    <div className="px-2 py-3">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Switch Role
        </span>
      </div>
      <div className="bg-muted/50 rounded-xl p-1 flex flex-col gap-1 border border-border/50">
        {userProfile.roles.map((role) => {
          const isActive = role === userProfile.activeRole;
          const colors = getRoleColors(role);
          const RoleIcon = ROLE_ICONS[role] || LayoutDashboard;

          return (
            <button
              key={role}
              onClick={() => handleSwitch(role)}
              disabled={switching}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left",
                isActive
                  ? `bg-white dark:bg-card shadow-sm ${colors.text} border border-border/50`
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-card/50"
              )}
            >
              {switching && role !== userProfile.activeRole ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RoleIcon className="w-3.5 h-3.5" />
              )}
              <span className="flex-1">{getRoleDisplayName(role)}</span>
              {isActive && (
                <div className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
