import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Role } from "@/lib/rbac";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[Role.HOSPITAL_ADMIN]}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
