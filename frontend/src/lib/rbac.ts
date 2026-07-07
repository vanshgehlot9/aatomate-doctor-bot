export enum Role {
  SUPER_ADMIN = "super_admin",
  HOSPITAL_ADMIN = "hospital_admin",
  DOCTOR = "doctor",
  STAFF = "staff", // General staff role
  RECEPTIONIST = "receptionist",
  NURSE = "nurse",
  LAB_TECHNICIAN = "lab_technician",
  PHARMACIST = "pharmacist",
  BILLING_EXECUTIVE = "billing_executive",
}

export interface UserProfile {
  uid: string;
  email: string;
  roles: Role[];        // All assigned roles
  activeRole: Role;     // Currently selected/active role
  role: Role;           // Alias for activeRole (backward compat)
  tenantId: string;
  hospitalId: string;
  name: string;
}

// --- Permission Checks ---

/** Check if the user's ACTIVE role is in the allowed list */
export const hasPermission = (activeRole: Role, allowedRoles: Role[]) => {
  return allowedRoles.includes(activeRole);
};

/** Check if the user has a specific role in their assigned roles */
export const hasRole = (profile: UserProfile, role: Role): boolean => {
  return profile.roles.includes(role);
};

/** Check if the user's active role matches */
export const hasActiveRole = (profile: UserProfile, role: Role): boolean => {
  return profile.activeRole === role;
};

/** Check if the user can switch between roles (has more than 1 role) */
export const canSwitchRoles = (profile: UserProfile): boolean => {
  return profile.roles.length > 1;
};

// --- Role Metadata ---

const ROLE_DASHBOARD_PATHS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: "/super-admin",
  [Role.HOSPITAL_ADMIN]: "/admin",
  [Role.DOCTOR]: "/doctor",
  [Role.STAFF]: "/staff",
  [Role.RECEPTIONIST]: "/staff",
  [Role.NURSE]: "/staff",
  [Role.LAB_TECHNICIAN]: "/staff",
  [Role.PHARMACIST]: "/staff",
  [Role.BILLING_EXECUTIVE]: "/staff",
};

/** Get the dashboard path for a given role */
export const getRoleDashboardPath = (role: Role): string => {
  return ROLE_DASHBOARD_PATHS[role] || "/staff";
};

const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [Role.SUPER_ADMIN]: "Super Admin",
  [Role.HOSPITAL_ADMIN]: "Hospital Admin",
  [Role.DOCTOR]: "Doctor",
  [Role.STAFF]: "Staff",
  [Role.RECEPTIONIST]: "Receptionist",
  [Role.NURSE]: "Nurse",
  [Role.LAB_TECHNICIAN]: "Lab Technician",
  [Role.PHARMACIST]: "Pharmacist",
  [Role.BILLING_EXECUTIVE]: "Billing Executive",
};

/** Get human-readable display name for a role */
export const getRoleDisplayName = (role: Role): string => {
  return ROLE_DISPLAY_NAMES[role] || role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};

const ROLE_COLORS: Record<Role, { bg: string; text: string; border: string; dot: string }> = {
  [Role.SUPER_ADMIN]: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400", border: "border-red-100 dark:border-red-900/50", dot: "bg-red-500" },
  [Role.HOSPITAL_ADMIN]: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-900/50", dot: "bg-emerald-500" },
  [Role.DOCTOR]: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-100 dark:border-blue-900/50", dot: "bg-blue-500" },
  [Role.STAFF]: { bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-700 dark:text-slate-400", border: "border-slate-100 dark:border-slate-900/50", dot: "bg-slate-500" },
  [Role.RECEPTIONIST]: { bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-700 dark:text-violet-400", border: "border-violet-100 dark:border-violet-900/50", dot: "bg-violet-500" },
  [Role.NURSE]: { bg: "bg-pink-50 dark:bg-pink-500/10", text: "text-pink-700 dark:text-pink-400", border: "border-pink-100 dark:border-pink-900/50", dot: "bg-pink-500" },
  [Role.LAB_TECHNICIAN]: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-100 dark:border-amber-900/50", dot: "bg-amber-500" },
  [Role.PHARMACIST]: { bg: "bg-teal-50 dark:bg-teal-500/10", text: "text-teal-700 dark:text-teal-400", border: "border-teal-100 dark:border-teal-900/50", dot: "bg-teal-500" },
  [Role.BILLING_EXECUTIVE]: { bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-700 dark:text-orange-400", border: "border-orange-100 dark:border-orange-900/50", dot: "bg-orange-500" },
};

/** Get the color config for a role (for badges, pills, etc.) */
export const getRoleColors = (role: Role) => {
  return ROLE_COLORS[role] || ROLE_COLORS[Role.STAFF];
};

/**
 * Parse a UserProfile from raw Supabase user data.
 * Handles both legacy single-role and new multi-role format.
 */
export function parseUserProfile(data: Record<string, any>): UserProfile {
  // Parse roles — handle both new format (roles array) and legacy (single role string)
  let roles: Role[] = [];
  if (data.roles && Array.isArray(data.roles) && data.roles.length > 0) {
    roles = data.roles as Role[];
  } else if (data.role) {
    roles = [data.role as Role];
  } else {
    roles = [Role.STAFF];
  }

  // Determine active role
  const activeRole = (data.active_role || data.activeRole || roles[0]) as Role;
  
  return {
    uid: data.id,
    email: data.email,
    name: data.name,
    roles,
    activeRole,
    role: activeRole, // backward compat alias
    tenantId: data.tenant_id,
    hospitalId: data.tenant_id,
  };
}
