import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Role } from "@/lib/rbac";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[Role.STAFF, Role.RECEPTIONIST, Role.NURSE, Role.LAB_TECHNICIAN, Role.PHARMACIST, Role.BILLING_EXECUTIVE]}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
