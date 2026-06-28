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
  role: Role;
  tenantId: string;
  hospitalId: string;
  name: string;
}

export const hasPermission = (userRole: Role, allowedRoles: Role[]) => {
  return allowedRoles.includes(userRole);
};
