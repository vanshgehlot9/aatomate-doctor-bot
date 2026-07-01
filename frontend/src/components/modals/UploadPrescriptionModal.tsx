"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// In a real app, this would be an axios call configured in lib/api.ts
const uploadPrescription = async (formData: FormData) => {
  const token = localStorage.getItem("auth_token");
  const tenantId = localStorage.getItem("tenant_id");
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/prescriptions/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-tenant-id': tenantId || '',
    },
    body: formData
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to upload prescription");
  }
  return res.json();
};

export function UploadPrescriptionModal({ appointmentId, patientId, doctorId, existingPrescriptionId, trigger }: { 
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  existingPrescriptionId?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: uploadPrescription,
    onSuccess: (data) => {
      toast.success("Prescription uploaded and digitized!");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to digitize prescription.");
    }
  });

  const handleUpload = () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    if (appointmentId) {
      formData.append("appointment_id", appointmentId);
    }
    formData.append("patient_id", patientId);
    formData.append("doctor_id", doctorId);
    
    uploadMutation.mutate(formData);
  };

  if (existingPrescriptionId) {
    return (
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" className="gap-2 text-green-600 border-green-200 bg-green-50">
          <CheckCircle2 className="w-4 h-4" />
          Digitized
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => window.open(`/prescriptions/${existingPrescriptionId}/pdf`, '_blank')}
        >
          Download PDF
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <UploadCloud className="w-4 h-4" />
            Upload
          </Button>
        )
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Prescription</DialogTitle>
          <DialogDescription>
            Upload a handwritten prescription. Our AI will digitize and structure it automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="picture">Prescription Image (JPG, PNG)</Label>
            <Input 
              id="picture" 
              type="file" 
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploadMutation.isPending}
            className="gap-2"
          >
            {uploadMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploadMutation.isPending ? "Digitizing..." : "Start AI OCR"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
