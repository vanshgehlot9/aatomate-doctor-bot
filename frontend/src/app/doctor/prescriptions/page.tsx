"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pill, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DoctorPrescriptionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground mt-1">Manage patient prescriptions and digital Rx.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Prescription
        </Button>
      </div>

      <Card className="border-dashed shadow-none">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 flex items-center justify-center rounded-full mb-4">
            <Pill className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Digital Prescriptions Coming Soon</CardTitle>
          <CardDescription>
            The digital prescription module is currently being integrated with the pharmacy network.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-8 pt-4">
          <Button variant="outline" className="mx-auto">
            Notify me when available
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
