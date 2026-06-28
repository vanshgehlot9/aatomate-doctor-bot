import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Role } from "@/lib/rbac";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[Role.DOCTOR]}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
