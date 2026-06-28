"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Activity, Pill, Microscope, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAppointments, getLaboratoryTests, getPatients } from "@/lib/api";

export default function DoctorDashboard() {
  const { data: appointments, isLoading: loadingAppts } = useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments
  });

  const { data: labTests, isLoading: loadingLabs } = useQuery({
    queryKey: ["laboratoryTests"],
    queryFn: getLaboratoryTests
  });

  const { data: patients, isLoading: loadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: getPatients
  });

  const isLoading = loadingAppts || loadingLabs || loadingPatients;

  // 1. Today's Appointments
  const todaysAppointments = appointments?.filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString()) || [];
  
  // 2. Current Queue (Scheduled for today)
  const upcomingPatients = todaysAppointments.filter(a => a.status === 'scheduled')
    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

  // 3. Unread Reports (Pending lab tests)
  const unreadReports = labTests?.filter(t => t.status === 'pending' || t.status === 'completed' && !t.result_summary).length || 0;

  // 4. Pending Follow-ups (Appointments with reason containing 'follow')
  const pendingFollowUps = appointments?.filter(a => 
    a.status === 'scheduled' && a.reason?.toLowerCase().includes('follow')
  ).length || 0;

  // AI Assistant Data - Next Patient in Queue
  const nextAppointment = upcomingPatients.length > 0 ? upcomingPatients[0] : null;
  const nextPatient = nextAppointment ? patients?.find(p => p.id === nextAppointment.patient_id) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctor Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of today's clinical activities.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingAppts ? "..." : todaysAppointments.length}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Queue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingAppts ? "..." : upcomingPatients.length}
            </div>
            <p className="text-xs text-muted-foreground">Waiting in lobby</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unread Reports</CardTitle>
            <Microscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingLabs ? "..." : unreadReports}
            </div>
            <p className="text-xs text-muted-foreground">New lab results available</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingAppts ? "..." : pendingFollowUps}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled follow-up sessions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Patients</CardTitle>
            <CardDescription>Your schedule for today.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingAppts || loadingPatients ? (
                <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground w-6 h-6" /></div>
              ) : upcomingPatients.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  No upcoming patients for today. Take a break!
                </div>
              ) : (
                upcomingPatients.map((appt) => {
                  const patient = patients?.find(p => p.id === appt.patient_id);
                  return (
                    <div key={appt.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {patient ? patient.name.substring(0, 2).toUpperCase() : appt.patient_id.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{patient ? patient.name : `Patient #${appt.patient_id.substring(0, 6)}`}</p>
                          <p className="text-sm text-muted-foreground">{appt.reason || "General Consultation"} • {appt.appointment_time}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-sm px-4 py-2 bg-primary/10 text-primary rounded-md font-medium hover:bg-primary/20 transition-colors">
                          View Profile
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Activity className="w-5 h-5" />
              Doctor AI Assistant
            </CardTitle>
            <CardDescription>Real-time patient insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>
            ) : nextPatient ? (
              <>
                <div className="p-3 bg-card rounded-md border text-sm shadow-sm">
                  <span className="font-semibold text-foreground">Next Patient Summary:</span>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    <strong>{nextPatient.name}</strong> is scheduled at {nextAppointment?.appointment_time} for: <br/>
                    <em>"{nextAppointment?.reason || 'General Consultation'}"</em>
                    {nextPatient.blood_group && <><br/>Blood Group: {nextPatient.blood_group}</>}
                  </p>
                </div>
                {nextPatient.allergies && nextPatient.allergies.length > 0 && (
                  <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900 text-sm shadow-sm">
                    <span className="font-semibold text-red-600 dark:text-red-400">Allergy Alert:</span>
                    <p className="text-red-700/80 dark:text-red-300/80 mt-1">
                      Patient is allergic to: <strong>{nextPatient.allergies.join(", ")}</strong>.
                    </p>
                  </div>
                )}
                {nextAppointment?.notes && (
                  <div className="p-3 bg-card rounded-md border text-sm shadow-sm">
                    <span className="font-semibold text-foreground">Pre-consultation Notes:</span>
                    <p className="text-muted-foreground mt-1 text-sm italic">"{nextAppointment.notes}"</p>
                  </div>
                )}
                <button className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                  Generate Full AI Assessment
                </button>
              </>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No upcoming patients to analyze right now.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
