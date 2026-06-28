"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Loader2, Users } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUsers, deleteUser } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { Role } from "@/lib/rbac";
import { AddUserModal } from "@/components/modals/AddUserModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminStaffPage() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers
  });

  // Filter staff for this specific hospital
  const hospitalStaff = users?.filter(
    (u) => u.tenantId === userProfile?.tenantId && u.role === Role.STAFF
  ) || [];

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
          <h1 className="text-3xl font-bold tracking-tight">Staff</h1>
          <p className="text-muted-foreground mt-1">Manage all staff members in your hospital.</p>
        </div>
        <AddUserModal fixedRole={Role.STAFF} fixedTenantId={userProfile?.tenantId} triggerText="Add Staff" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Staff Directory
          </CardTitle>
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
  );
}
