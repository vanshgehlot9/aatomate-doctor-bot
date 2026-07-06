import { RoleGuard } from "@/components/layout/RoleGuard";
import { SuperAdminLayout as Layout } from "@/components/layout/SuperAdminLayout";
import { Role } from "@/lib/rbac";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[Role.SUPER_ADMIN]}>
      <Layout>
        {children}
      </Layout>
    </RoleGuard>
  );
}

