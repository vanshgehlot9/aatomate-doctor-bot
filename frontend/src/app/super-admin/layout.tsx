import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Role } from "@/lib/rbac";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[Role.SUPER_ADMIN]}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
