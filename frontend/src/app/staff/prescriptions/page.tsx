"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PharmacyPrescriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pharmacy Prescriptions</h1>
        <p className="text-muted-foreground mt-1">Manage and dispense prescribed medications.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Pharmacy Prescriptions Data
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID / Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Activity className="w-8 h-8 opacity-20" />
                    <p>This module is actively being developed.</p>
                    <p className="text-xs">Database integration coming soon.</p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
