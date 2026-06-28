"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Activity, ShieldAlert, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTenants, getUsers } from "@/lib/api";
import { Role } from "@/lib/rbac";

import { AddHospitalModal } from "@/components/modals/AddHospitalModal";
import { AddUserModal } from "@/components/modals/AddUserModal";

export default function SuperAdminDashboard() {
  const { data: tenants, isLoading: loadingTenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: getTenants
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers
  });

  const totalHospitals = tenants?.length || 0;
  const activeTenants = tenants?.filter(t => t.is_active).length || 0;
  const totalUsers = users?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground mt-1">Global telemetry and SaaS management.</p>
        </div>
        <div className="flex items-center gap-3">
          <AddUserModal tenants={tenants || []} fixedRole={Role.HOSPITAL_ADMIN} triggerText="Add Admin" />
          <AddHospitalModal />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Hospitals</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingTenants ? "..." : totalHospitals}
            </div>
            <p className="text-xs text-muted-foreground">{activeTenants} active currently</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingUsers ? "..." : totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Errors</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-muted-foreground">Telemetry required</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
