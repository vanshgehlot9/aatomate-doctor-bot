"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Loader2, Stethoscope, Calendar } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDoctors, deleteDoctor } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { Role } from "@/lib/rbac";
import { AddUserModal } from "@/components/modals/AddUserModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDoctorsPage() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { data: doctors, isLoading: loadingDoctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: getDoctors
  });

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
          <p className="text-muted-foreground mt-1">Manage all doctors in your hospital.</p>
        </div>
        <AddUserModal fixedRole={Role.DOCTOR} fixedTenantId={userProfile?.tenantId} triggerText="Add Doctor" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            Doctors Directory
          </CardTitle>
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => router.push(`/admin/doctors/${doc.id}/schedule`)}
                          >
                            <Calendar className="w-4 h-4" /> Schedule
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteDoctor(doc.id)}
                            disabled={deletingId === doc.id}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
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
