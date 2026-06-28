"use client";

import { useQuery } from "@tanstack/react-query";
import { getTenants } from "@/lib/api";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { AddHospitalModal } from "@/components/modals/AddHospitalModal";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function HospitalsPage() {
  const { data: tenants, isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: getTenants
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospitals</h1>
          <p className="text-muted-foreground mt-1">Manage all registered hospital tenants.</p>
        </div>
        <div className="flex items-center gap-3">
          <AddHospitalModal />
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
                <TableHead>Hospital Name</TableHead>
                <TableHead>Owner / Admin Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hospitals found.
                  </TableCell>
                </TableRow>
              ) : (
                tenants?.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.hospital_name || tenant.name}</TableCell>
                    <TableCell>{tenant.name}</TableCell>
                    <TableCell>{tenant.email || "N/A"}</TableCell>
                    <TableCell>{tenant.phone_number || "N/A"}</TableCell>
                    <TableCell>
                      {tenant.is_active ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </TableCell>
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
