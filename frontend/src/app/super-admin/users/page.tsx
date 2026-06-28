"use client";

import { useQuery } from "@tanstack/react-query";
import { getUsers, getTenants } from "@/lib/api";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { AddUserModal } from "@/components/modals/AddUserModal";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Role } from "@/lib/rbac";

export default function UsersPage() {
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers
  });

  const { data: tenants, isLoading: loadingTenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: getTenants
  });

  const isLoading = loadingUsers || loadingTenants;

  const getTenantName = (tenantId: string) => {
    if (!tenantId) return "N/A";
    const tenant = tenants?.find(t => t.id === tenantId);
    return tenant ? (tenant.hospital_name || tenant.name) : tenantId;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case Role.SUPER_ADMIN:
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">Super Admin</Badge>;
      case Role.HOSPITAL_ADMIN:
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Hospital Admin</Badge>;
      case Role.DOCTOR:
        return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">Doctor</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize">{role.replace("_", " ")}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage all registered users across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <AddUserModal tenants={tenants || []} triggerText="Add User" />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Hospital</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!users || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getTenantName(user.tenantId)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
