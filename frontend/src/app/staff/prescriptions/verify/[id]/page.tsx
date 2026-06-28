"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getPrescription, verifyPrescription } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";

// Helper component for Confidence highlighting
const ConfidenceInput = ({ fieldName, fieldObj, onChange, multiline = false }: any) => {
  if (!fieldObj) return null;
  
  const status = fieldObj.status;
  
  // Color coding based on AI confidence
  let borderColor = "border-input";
  let icon = null;
  
  if (status === "low") {
    borderColor = "border-red-500 focus-visible:ring-red-500";
    icon = <AlertTriangle className="w-4 h-4 text-red-500 absolute right-3 top-3" />;
  } else if (status === "medium") {
    borderColor = "border-yellow-500 focus-visible:ring-yellow-500";
    icon = <AlertTriangle className="w-4 h-4 text-yellow-500 absolute right-3 top-3" />;
  } else if (status === "high") {
    borderColor = "border-green-500 focus-visible:ring-green-500";
    icon = <CheckCircle className="w-4 h-4 text-green-500 absolute right-3 top-3" />;
  } else if (status === "verified") {
    borderColor = "border-blue-500 focus-visible:ring-blue-500";
    icon = <CheckCircle className="w-4 h-4 text-blue-500 absolute right-3 top-3" />;
  }

  const handleChange = (e: any) => {
    // When a human edits, we update the status to "verified"
    onChange({
      ...fieldObj,
      value: e.target.value,
      status: "verified"
    });
  };

  return (
    <div className="relative">
      {multiline ? (
        <Textarea 
          value={fieldObj.value || ""} 
          onChange={handleChange}
          className={`${borderColor} pr-10`}
          rows={3}
        />
      ) : (
        <Input 
          value={fieldObj.value || ""} 
          onChange={handleChange}
          className={`${borderColor} pr-10`}
        />
      )}
      {icon}
    </div>
  );
};


export default function VerifyPrescriptionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: prescription, isLoading } = useQuery({
    queryKey: ["prescription", id],
    queryFn: () => getPrescription(id),
  });

  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (prescription) {
      setFormData(prescription);
    }
  }, [prescription]);

  const verifyMutation = useMutation({
    mutationFn: (data: any) => verifyPrescription(id, data),
    onSuccess: () => {
      toast.success("Prescription verified successfully!");
      router.push("/staff/appointments"); // or back to a queue
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to verify prescription");
    }
  });

  const handleSave = () => {
    verifyMutation.mutate(formData);
  };

  if (isLoading || !formData) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verify Prescription</h1>
          <p className="text-muted-foreground mt-1">
            Review OCR extraction. Fix <span className="text-red-500 font-semibold">Red</span> and <span className="text-yellow-500 font-semibold">Yellow</span> fields.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSave} disabled={verifyMutation.isPending} className="gap-2">
            {verifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Submit Verification
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-hidden pb-4">
        {/* Left Side: Original Image */}
        <Card className="h-full flex flex-col">
          <CardHeader className="py-4">
            <CardTitle>Original Upload</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center border-t">
            {/* In a real app, use the actual image_url. Here we use a placeholder or img tag */}
            {formData.image_url ? (
              <div className="text-center text-muted-foreground">
                [Image Viewer: Zoom/Pan Tools Here]
                <br/>
                <span className="text-xs">Original URL: {formData.image_url}</span>
              </div>
            ) : (
              <p className="text-muted-foreground">No image available</p>
            )}
          </CardContent>
        </Card>

        {/* Right Side: Editable Form */}
        <Card className="h-full flex flex-col">
          <CardHeader className="py-4">
            <CardTitle className="flex justify-between items-center">
              <span>Structured Data</span>
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                AI Confidence: {Math.round(formData.overall_confidence || 0)}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Patient Name</Label>
                <ConfidenceInput 
                  fieldObj={formData.patient_name} 
                  onChange={(val: any) => setFormData({...formData, patient_name: val})} 
                />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <ConfidenceInput 
                  fieldObj={formData.prescription_date} 
                  onChange={(val: any) => setFormData({...formData, prescription_date: val})} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Chief Complaint</Label>
              <ConfidenceInput 
                fieldObj={formData.chief_complaint} 
                onChange={(val: any) => setFormData({...formData, chief_complaint: val})} 
                multiline
              />
            </div>

            <div className="space-y-1">
              <Label>Clinical Notes</Label>
              <ConfidenceInput 
                fieldObj={formData.clinical_notes} 
                onChange={(val: any) => setFormData({...formData, clinical_notes: val})} 
                multiline
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Medicines</h3>
              {formData.medicines?.map((med: any, idx: number) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-lg border mb-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Medicine Name</Label>
                      <ConfidenceInput 
                        fieldObj={med.medicine_name} 
                        onChange={(val: any) => {
                          const newMeds = [...formData.medicines];
                          newMeds[idx].medicine_name = val;
                          setFormData({...formData, medicines: newMeds});
                        }} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dosage / Strength</Label>
                      <ConfidenceInput 
                        fieldObj={med.dosage || med.strength} 
                        onChange={(val: any) => {
                          const newMeds = [...formData.medicines];
                          newMeds[idx].dosage = val;
                          setFormData({...formData, medicines: newMeds});
                        }} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Frequency</Label>
                      <ConfidenceInput 
                        fieldObj={med.frequency} 
                        onChange={(val: any) => {
                          const newMeds = [...formData.medicines];
                          newMeds[idx].frequency = val;
                          setFormData({...formData, medicines: newMeds});
                        }} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Duration</Label>
                      <ConfidenceInput 
                        fieldObj={med.duration} 
                        onChange={(val: any) => {
                          const newMeds = [...formData.medicines];
                          newMeds[idx].duration = val;
                          setFormData({...formData, medicines: newMeds});
                        }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Follow-up & Notes</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <Label>Follow-up Date / Interval</Label>
                  <ConfidenceInput 
                    fieldObj={formData.follow_up_date} 
                    onChange={(val: any) => setFormData({...formData, follow_up_date: val})} 
                  />
                </div>
                <div className="space-y-1">
                  <Label>Special Instructions</Label>
                  <ConfidenceInput 
                    fieldObj={formData.special_notes} 
                    onChange={(val: any) => setFormData({...formData, special_notes: val})} 
                    multiline
                  />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
