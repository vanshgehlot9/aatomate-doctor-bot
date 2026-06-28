"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Stethoscope, Users, CreditCard, Trash2, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDoctors, getAppointments, getUsers, deleteDoctor, deleteUser } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { Role } from "@/lib/rbac";
import { AddUserModal } from "@/components/modals/AddUserModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { data: doctors, isLoading: loadingDoctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: getDoctors
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers
  });

  const { data: appointments, isLoading: loadingAppts } = useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments
  });

  // Derived Stats
  const totalDoctors = doctors?.length || 0;
  
  // Calculate unique departments/specialties from active doctors
  const departments = new Set(doctors?.map(d => d.specialization).filter(Boolean));
  const totalDepartments = departments.size;

  // Filter staff for this specific hospital
  const hospitalStaff = users?.filter(
    (u) => u.tenantId === userProfile?.tenantId && u.role === Role.STAFF
  ) || [];
  const totalStaff = hospitalStaff.length;

  const completedAppts = appointments?.filter(a => a.status === 'completed').length || 0;
  const estimatedRevenue = completedAppts * 500;

  // Handlers
  const handleDeleteDoctor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return;
    setDeletingId(id);
    try {
      await deleteDoctor(id, userProfile?.tenantId);
      toast.success("Doctor deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete doctor");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteStaff = async (uid: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    setDeletingId(uid);
    try {
      await deleteUser(uid);
      toast.success("Staff member deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete staff");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospital Administration</h1>
          <p className="text-muted-foreground mt-1">Manage doctors, staff, and hospital settings.</p>
        </div>
        <div className="flex items-center gap-3">
          <AddUserModal fixedRole={Role.DOCTOR} fixedTenantId={userProfile?.tenantId} triggerText="Add Doctor" />
          <AddUserModal fixedRole={Role.STAFF} fixedTenantId={userProfile?.tenantId} triggerText="Add Staff" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingDoctors ? "..." : totalDoctors}
            </div>
            <p className="text-xs text-muted-foreground">Registered in platform</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingUsers ? "..." : totalStaff}
            </div>
            <p className="text-xs text-muted-foreground">Active staff members</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingDoctors ? "..." : totalDepartments}
            </div>
            <p className="text-xs text-muted-foreground">Unique specialties</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Est. Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingAppts ? "..." : `₹${estimatedRevenue.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">Based on completed appointments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Doctors Directory</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingDoctors ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No doctors found.</TableCell>
                    </TableRow>
                  ) : (
                    doctors?.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>{doc.specialization}</TableCell>
                        <TableCell>₹{doc.consultation_fee}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteDoctor(doc.id)}
                            disabled={deletingId === doc.id}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Directory</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingUsers ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitalStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No staff found.</TableCell>
                    </TableRow>
                  ) : (
                    hospitalStaff.map((staff) => (
                      <TableRow key={staff.uid}>
                        <TableCell className="font-medium">{staff.name}</TableCell>
                        <TableCell>{staff.email}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteStaff(staff.uid)}
                            disabled={deletingId === staff.uid}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            {deletingId === staff.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
