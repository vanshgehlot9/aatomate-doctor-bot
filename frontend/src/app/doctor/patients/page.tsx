"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPatients } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UploadPrescriptionModal } from "@/components/modals/UploadPrescriptionModal";

export default function DoctorPatientsPage() {
  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: getPatients
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground mt-1">Directory of all registered patients.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Patient Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Demographics</TableHead>
                  <TableHead>Allergies</TableHead>
                  <TableHead className="w-[200px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No patients found.</TableCell>
                  </TableRow>
                ) : (
                  patients?.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          {patient.gender && <span>{patient.gender}</span>}
                          {patient.blood_group && <span>• {patient.blood_group}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {patient.allergies?.length > 0 ? (
                          <span className="text-destructive font-medium text-sm">
                            {patient.allergies.join(", ")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">View History</Button>
                          <UploadPrescriptionModal 
                            patientId={patient.id} 
                            doctorId="unknown_doctor_id" // Will be fixed below when we use the context or hook
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
