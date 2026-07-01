"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAppointment } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { Loader2, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function WriteNoteModal({ patients, appointments, trigger }: { patients: any[], appointments: any[], trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  
  const [appointmentId, setAppointmentId] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const todaysAppointments = appointments?.filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString()) || [];

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, notes: string }) => updateAppointment(data.id, { notes: data.notes, tenant_id: userProfile?.tenantId }),
    onSuccess: () => {
      toast.success("Clinical note saved securely!");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setOpen(false);
      setAppointmentId("");
      setNote("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save note");
    }
  });

  const handleSave = () => {
    if (!appointmentId || !note.trim()) return;
    updateMutation.mutate({ id: appointmentId, notes: note });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          trigger || (
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              Write Note
            </Button>
          )
        } 
      />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Write Clinical Note</DialogTitle>
          <DialogDescription>
            Attach a secure clinical note to a patient's appointment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Appointment (Today)</Label>
            <Select value={appointmentId} onValueChange={(v) => {
              setAppointmentId(v);
              const appt = appointments.find(a => a.id === v);
              if (appt?.notes) setNote(appt.notes);
              else setNote("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a patient's appointment" />
              </SelectTrigger>
              <SelectContent>
                {todaysAppointments.map(appt => {
                  const patient = patients?.find(p => p.id === appt.patient_id);
                  return (
                    <SelectItem key={appt.id} value={appt.id}>
                      {appt.appointment_time} - {patient?.name || "Unknown"} ({appt.reason})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Clinical Notes</Label>
            <Textarea 
              placeholder="Enter symptoms, diagnosis, or general notes..." 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[150px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={!appointmentId || !note.trim() || updateMutation.isPending}
              className="gap-2 bg-primary"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Save Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
