"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getPrescription } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function PrescriptionPDFPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: prescription, isLoading } = useQuery({
    queryKey: ["prescription", id],
    queryFn: () => getPrescription(id),
  });

  useEffect(() => {
    if (prescription && !isLoading) {
      // Small delay to ensure render is complete
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [prescription, isLoading]);

  if (isLoading || !prescription) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto font-sans min-h-screen">
      {/* Header */}
      <div className="border-b-2 border-black pb-6 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-widest text-primary">Aatomate Medical</h1>
          <p className="text-sm text-gray-600 mt-1">123 Health Ave, Medical District</p>
          <p className="text-sm text-gray-600">Phone: +91 999 999 9999</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">{prescription.doctor_name?.value || "Dr. Authorized Physician"}</h2>
          <p className="text-sm text-gray-600">{prescription.doctor_registration?.value || "Reg: XYZ-12345"}</p>
          <p className="text-sm font-medium mt-2">Date: {prescription.prescription_date?.value || new Date(prescription.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Patient Info */}
      <div className="bg-gray-50 p-4 rounded-lg mb-8 flex justify-between border">
        <div>
          <p className="text-sm text-gray-500 uppercase font-semibold">Patient Name</p>
          <p className="text-lg font-bold">{prescription.patient_name?.value || "Unknown Patient"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 uppercase font-semibold">Age / Gender</p>
          <p className="text-lg font-bold">
            {prescription.patient_age?.value || "--"} / {prescription.patient_gender?.value || "--"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 uppercase font-semibold">Vitals</p>
          <p className="text-sm">
            BP: {prescription.vitals?.blood_pressure?.value || "--"} | Temp: {prescription.vitals?.temperature?.value || "--"}
          </p>
        </div>
      </div>

      {/* Clinical Notes */}
      <div className="mb-8">
        <h3 className="text-lg font-bold border-b pb-2 mb-3">Clinical Notes & Diagnosis</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 uppercase font-semibold mb-1">Chief Complaint</p>
            <p className="text-sm whitespace-pre-wrap">{prescription.chief_complaint?.value || "--"}</p>
            
            <p className="text-sm text-gray-500 uppercase font-semibold mt-4 mb-1">Notes</p>
            <p className="text-sm whitespace-pre-wrap">{prescription.clinical_notes?.value || "--"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase font-semibold mb-1">Diagnosis</p>
            {prescription.diagnoses?.length > 0 ? (
              <ul className="list-disc pl-5">
                {prescription.diagnoses.map((d: any, idx: number) => (
                  <li key={idx} className="text-sm">
                    <span className="font-medium">{d.condition?.value}</span> 
                    {d.notes?.value && <span className="text-gray-600 block text-xs">{d.notes.value}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">--</p>
            )}
          </div>
        </div>
      </div>

      {/* Rx Medicines */}
      <div className="mb-8">
        <div className="flex items-center gap-3 border-b pb-2 mb-4">
          <span className="text-4xl font-serif font-bold text-gray-800 italic pr-2">Rx</span>
          <h3 className="text-lg font-bold">Medicines</h3>
        </div>
        
        {prescription.medicines?.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-sm font-semibold uppercase text-gray-600 border-b">Medicine</th>
                <th className="p-3 text-sm font-semibold uppercase text-gray-600 border-b">Dosage</th>
                <th className="p-3 text-sm font-semibold uppercase text-gray-600 border-b">Frequency</th>
                <th className="p-3 text-sm font-semibold uppercase text-gray-600 border-b">Duration</th>
              </tr>
            </thead>
            <tbody>
              {prescription.medicines.map((med: any, idx: number) => (
                <tr key={idx} className="border-b">
                  <td className="p-3">
                    <p className="font-bold">{med.medicine_name?.value || "--"}</p>
                    {med.instructions?.value && <p className="text-xs text-gray-500">{med.instructions.value}</p>}
                  </td>
                  <td className="p-3 text-sm">{med.dosage?.value || med.strength?.value || "--"}</td>
                  <td className="p-3 text-sm">{med.frequency?.value || "--"}</td>
                  <td className="p-3 text-sm">{med.duration?.value || "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-500 italic">No medicines prescribed.</p>
        )}
      </div>

      {/* Investigations */}
      {prescription.investigations?.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold border-b pb-2 mb-3">Investigations Requested</h3>
          <ul className="list-disc pl-5">
            {prescription.investigations.map((inv: any, idx: number) => (
              <li key={idx} className="text-sm">
                <span className="font-medium">{inv.test_name?.value}</span>
                {inv.notes?.value && <span className="text-gray-600 ml-2">({inv.notes.value})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer / Follow Up */}
      <div className="mt-16 border-t-2 border-black pt-6 flex justify-between items-end">
        <div>
          <p className="text-sm font-bold uppercase text-gray-500">Follow Up</p>
          <p className="text-lg font-medium text-primary mt-1">{prescription.follow_up_date?.value || "As needed"}</p>
          <p className="text-sm mt-2">{prescription.special_notes?.value || ""}</p>
        </div>
        <div className="text-center">
          <div className="border-b border-black w-48 mb-2"></div>
          <p className="text-sm font-bold text-gray-500 uppercase">Doctor's Signature</p>
        </div>
      </div>
    </div>
  );
}
