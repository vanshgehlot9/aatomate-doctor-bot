"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, FileText, IndianRupee } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAppointments, getLaboratoryTests } from "@/lib/api";
import { BookAppointmentModal } from "@/components/modals/BookAppointmentModal";

export default function StaffDashboard() {
  const { data: appointments, isLoading: loadingAppts } = useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments
  });

  const { data: labTests, isLoading: loadingLabs } = useQuery({
    queryKey: ["labTests"],
    queryFn: getLaboratoryTests
  });

  const todaysAppointments = appointments?.filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString()) || [];
  const completedAppts = todaysAppointments.filter(a => a.status === 'completed');
  const pendingReports = labTests?.filter(l => l.status === 'pending' || l.status === 'in_progress') || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage today's hospital operations.</p>
        </div>
        <BookAppointmentModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingAppts ? "..." : todaysAppointments.length}
            </div>
            <p className="text-xs text-muted-foreground">{completedAppts.length} completed</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Walk-In Queue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingAppts ? "..." : todaysAppointments.filter(a => a.status === 'pending' || a.status === 'waiting').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently waiting</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingAppts ? "..." : `₹${todaysAppointments.filter(a => a.status === 'pending').length * 500}`}
            </div>
            <p className="text-xs text-muted-foreground">
              From {loadingAppts ? "..." : todaysAppointments.filter(a => a.status === 'pending').length} patients
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingLabs ? "..." : pendingReports.length}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Patients Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingAppts ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading queue...</div>
              ) : todaysAppointments.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No patients in queue today.</div>
              ) : (
                todaysAppointments.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between p-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xs">
                        {appt.patient_id.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">Patient #{appt.patient_id.substring(0, 6)}</p>
                        <p className="text-xs text-muted-foreground">{appt.status} • {appt.appointment_time}</p>
                      </div>
                    </div>
                    <button className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded hover:bg-secondary/20">
                      Process
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
