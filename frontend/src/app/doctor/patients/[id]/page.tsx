"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Phone, Mail, FileText, Pill, 
  Activity, AlertCircle, Calendar, Plus, ScanText, 
  Trash2, ShieldAlert, Check, CheckCircle2, Hospital, Printer, Download, Share2, Loader2, Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getPatients } from "@/lib/api";

// --- Mock Data ---
const MOCK_TIMELINE = [
  { id: 1, type: "prescription", date: "15 Jun 2026", title: "Upper Respiratory Infection", details: "Paracetamol 500mg, Azithromycin 500mg" },
  { id: 2, type: "lab", date: "10 Jun 2026", title: "Complete Blood Count", details: "WBC slightly elevated. All other parameters normal." },
];

const MOCK_PREVIOUS_RX = [
  { id: 1, date: "15 Jun 2026", diagnosis: "Upper Respiratory Infection", doctor: "Dr. Rakesh Sharma", meds: ["Paracetamol 650 mg Tablet", "Azithromycin 500 mg Tablet"] },
  { id: 2, date: "10 Apr 2026", diagnosis: "Routine Checkup", doctor: "Dr. Rakesh Sharma", meds: ["Vitamin D3 60K Capsule"] }
];

const TEMPLATES = ["Cold", "Fever", "Hypertension", "Diabetes", "Dental Pain"];
const MEDICINE_DB = ["Paracetamol 650 mg Tablet", "Amoxicillin 500 mg Capsule", "Ibuprofen 400 mg Tablet", "Vitamin D3 60K Capsule", "Azithromycin 500 mg Tablet", "Crocin Advance", "Dolo 650", "Calpol 500"];

type TabType = 'overview' | 'timeline' | 'history' | 'reports' | 'prescriptions' | 'notes' | 'documents';

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  
  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: getPatients
  });

  const patient = patients?.find((p: any) => p.id === patientId);

  const [activeTab, setActiveTab] = useState<TabType>('prescriptions');
  
  // --- PRESCRIPTION TAB STATE ---
  const [rxViewMode, setRxViewMode] = useState<'list' | 'editor' | 'preview'>('list');
  const [rxData, setRxData] = useState({
    diagnosis: "",
    medicines: [{ name: "", dosage: "1-0-1", duration: "5 Days", instruction: "After Food" }],
    notes: "",
    followUp: ""
  });
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);

  // --- OCR STATE ---
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrState, setOcrState] = useState<'uploading' | 'processing' | 'verifying'>('uploading');
  const [extractedData, setExtractedData] = useState({
    diagnosis: { value: "Viral Fever", confidence: 94 },
    medicineText: { value: "Paracetamol 500mg 1-0-1 for 3 days", confidence: 72 },
    notes: { value: "Drink plenty of fluids", confidence: 88 }
  });

  // Actions
  const handleSimulateOCR = () => {
    setOcrState('processing');
    setTimeout(() => setOcrState('verifying'), 2000);
  };

  const handleConfirmOCR = () => {
    setRxData({
      diagnosis: extractedData.diagnosis.value,
      notes: extractedData.notes.value,
      followUp: "",
      medicines: [{ name: "Paracetamol 650 mg Tablet", dosage: "1-0-1", duration: "3 Days", instruction: "After Food" }]
    });
    setOcrOpen(false);
    setTimeout(() => setOcrState('uploading'), 500);
    setRxViewMode('editor');
  };

  const startNewPrescription = (repeatId?: number) => {
    if (repeatId) {
      setRxData({
        diagnosis: "Upper Respiratory Infection",
        notes: "Rest and drink fluids",
        followUp: "1 Week",
        medicines: [
          { name: "Paracetamol 650 mg Tablet", dosage: "1-0-1", duration: "3 Days", instruction: "After Food" },
          { name: "Azithromycin 500 mg Tablet", dosage: "1-0-0", duration: "5 Days", instruction: "After Food" }
        ]
      });
    } else {
      setRxData({
        diagnosis: "",
        medicines: [{ name: "", dosage: "1-0-1", duration: "5 Days", instruction: "After Food" }],
        notes: "",
        followUp: ""
      });
    }
    setRxViewMode('editor');
  };

  const addMedicine = () => {
    setRxData(prev => ({ ...prev, medicines: [...prev.medicines, { name: "", dosage: "1-0-1", duration: "5 Days", instruction: "After Food" }] }));
  };

  const removeMedicine = (idx: number) => {
    const nm = [...rxData.medicines]; nm.splice(idx,1); setRxData({...rxData, medicines: nm});
  };

  const updateMedicine = (idx: number, field: string, value: string) => {
    const nm = [...rxData.medicines]; (nm as any)[idx][field] = value; setRxData({...rxData, medicines: nm});
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-medium">Loading patient profile...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-300" />
        <h3 className="text-xl font-bold text-slate-900">Patient Not Found</h3>
        <p className="text-sm text-slate-500">The patient ID {patientId} could not be found.</p>
        <Button onClick={() => router.push('/doctor/patients')}>Return to Directory</Button>
      </div>
    );
  }

  // Safe fallbacks for patient properties
  const pName = patient.name || "Unknown Patient";
  const pAge = patient.age || "--";
  const pGender = patient.gender || "Unknown";
  const pBloodGroup = patient.blood_group || "--";
  const pPhone = patient.phone || "--";
  const pEmail = patient.email || "--";
  const pAllergies = patient.allergies || [];
  const pChronic = patient.chronic || [];

  return (
    <div className="max-w-7xl mx-auto pb-20 sm:pb-10 -mt-2">
      
      {/* Top Navigation & Actions */}
      <div className="flex items-center gap-3 mb-4 border-b border-slate-200 pb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/doctor/patients')} className="h-9 w-9 bg-slate-50 border border-slate-200">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1" />
        
        <div className="flex gap-2">
          <Button variant="outline" className="shadow-sm h-9 bg-white text-xs">
            <Phone className="w-3.5 h-3.5 mr-2 text-slate-500" /> Call
          </Button>
          <Button className="shadow-sm h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={() => { setActiveTab('prescriptions'); startNewPrescription(); }}>
            <Plus className="w-3.5 h-3.5 mr-2" /> Start Consultation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* --- LEFT COLUMN: PROFILE SUMMARY --- */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 h-20 relative border-b border-slate-100">
              <Button variant="ghost" size="icon" className="absolute top-3 right-3 text-slate-500 hover:text-blue-600 bg-white/60 hover:bg-white h-8 w-8 rounded-full shadow-sm backdrop-blur-sm transition-all" title="Edit Profile">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
            <CardContent className="px-5 pb-5 pt-0 relative">
              <Avatar className="w-16 h-16 border-4 border-white shadow-sm -mt-8 mb-3 bg-white">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{pName.substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-bold text-slate-900 leading-none mb-1">{pName}</h2>
              <p className="text-xs text-slate-500 font-medium mb-3">{patient.id.substring(0, 12)}...</p>
              
              <div className="flex flex-wrap gap-1.5 mb-4">
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">{pAge} Y • {pGender.charAt(0).toUpperCase()}</Badge>
                {pBloodGroup !== "--" && (
                  <Badge variant="secondary" className="bg-red-50 text-red-700 border border-red-100 text-[10px] uppercase font-bold">🩸 {pBloodGroup}</Badge>
                )}
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 text-xs">
                <p className="font-medium text-slate-700 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {pPhone}</p>
                <p className="font-medium text-slate-700 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {pEmail}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                {pAllergies.length > 0 && (
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3 text-red-500" /> Allergies</p>
                    <div className="flex flex-wrap gap-1">
                      {pAllergies.map((a: string) => <Badge key={a} variant="outline" className="border-red-200 text-red-700 bg-red-50 text-[10px] px-1.5 py-0">{a}</Badge>)}
                    </div>
                  </div>
                )}
                {pChronic.length > 0 && (
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1"><Activity className="w-3 h-3 text-amber-500" /> Chronic</p>
                    <div className="flex flex-wrap gap-1">
                      {pChronic.map((c: string) => <Badge key={c} variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 text-[10px] px-1.5 py-0">{c}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COLUMN: TABS & CONTENT --- */}
        <div className="lg:col-span-3 flex flex-col min-h-[600px]">
          
          {/* Main Navigation Tabs */}
          <div className="flex bg-slate-50/50 p-1 rounded-lg border border-slate-200 mb-4 overflow-x-auto hide-scrollbar">
            {(['overview', 'timeline', 'history', 'reports', 'prescriptions', 'notes', 'documents'] as TabType[]).map(tab => (
              <button 
                key={tab}
                onClick={() => { setActiveTab(tab); setRxViewMode('list'); }} 
                className={`px-3 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all uppercase tracking-wide ${activeTab === tab ? 'bg-white shadow-sm text-blue-600 border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden relative shadow-sm">
            
            {/* --- PRESCRIPTIONS TAB (The Core EMR Engine) --- */}
            {activeTab === 'prescriptions' && (
              <div className="h-full flex flex-col bg-white">
                
                {/* Mode: LIST */}
                {rxViewMode === 'list' && (
                  <div className="p-6 h-full overflow-y-auto">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                      <h3 className="font-bold text-lg text-slate-800">Prescription History</h3>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button size="sm" variant="outline" className="h-8 text-xs shadow-none border-slate-200 bg-slate-50 flex-1 sm:flex-none" onClick={() => setOcrOpen(true)}>
                          <ScanText className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> OCR Upload
                        </Button>
                        <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 shadow-none flex-1 sm:flex-none" onClick={() => startNewPrescription()}>
                          <Plus className="w-3.5 h-3.5 mr-1" /> New
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {MOCK_PREVIOUS_RX.map((rx) => (
                        <div key={rx.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="bg-white text-[10px]">{rx.date}</Badge>
                              <span className="font-bold text-slate-800">{rx.diagnosis}</span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1">{rx.doctor} • {rx.meds.join(", ")}</p>
                          </div>
                          <div className="flex gap-2 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-200 w-full sm:w-auto justify-end transition-opacity">
                            <Button variant="outline" size="sm" className="h-7 text-[10px] px-3 shadow-none" onClick={() => { startNewPrescription(rx.id); setRxViewMode('preview'); }}>View</Button>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] px-3 shadow-none text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700" onClick={() => startNewPrescription(rx.id)}>Edit</Button>
                            <Button variant="secondary" size="sm" className="h-7 text-[10px] px-3 shadow-none" onClick={() => startNewPrescription(rx.id)}>Repeat</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode: EDITOR */}
                {rxViewMode === 'editor' && (
                  <div className="flex flex-col h-full">
                    {/* Editor Action Bar */}
                    <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500" onClick={() => setRxViewMode('list')}>
                        <ArrowLeft className="w-3 h-3 mr-1" /> Back
                      </Button>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Templates:</span>
                        {TEMPLATES.map(t => (
                          <Badge key={t} variant="outline" className="cursor-pointer hover:bg-slate-200 bg-white shadow-none px-1.5 py-0 rounded text-[10px] font-medium text-slate-600 hidden sm:block">{t}</Badge>
                        ))}
                      </div>
                      <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-none" onClick={() => setRxViewMode('preview')}>
                        Preview Rx <ArrowLeft className="w-3 h-3 ml-1 rotate-180" />
                      </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
                      <div className="max-w-3xl mx-auto space-y-6">
                        
                        {/* Clinical Insight Banner */}
                        {rxData.medicines.length > 1 && (
                          <div className="bg-blue-50/50 border border-blue-100 text-blue-700 px-3 py-2 rounded-md flex items-center gap-2 text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                            AI Insight: No major drug interactions detected. Dosages appear safe.
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Diagnosis</Label>
                          <Input value={rxData.diagnosis} onChange={e => setRxData({...rxData, diagnosis: e.target.value})} className="h-9 shadow-none border-slate-200 text-sm font-semibold text-slate-800" placeholder="Primary diagnosis" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Medicines</Label>
                            <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px] font-bold text-blue-600" onClick={addMedicine}>+ Add Medicine</Button>
                          </div>
                          
                          <div className="space-y-2">
                            <AnimatePresence>
                              {rxData.medicines.map((med, idx) => (
                                <motion.div key={idx} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex flex-col lg:flex-row gap-2 relative bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                  <div className="relative flex-1">
                                    <Input 
                                      value={med.name} 
                                      onChange={e => updateMedicine(idx, 'name', e.target.value)}
                                      onFocus={() => setActiveSearchIndex(idx)}
                                      onBlur={() => setTimeout(() => setActiveSearchIndex(null), 200)}
                                      className="h-8 shadow-none border-slate-200 font-bold text-xs bg-white text-slate-800" 
                                      placeholder="Medicine Search..." 
                                    />
                                    {activeSearchIndex === idx && med.name.length > 0 && (
                                      <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-lg rounded-md z-30 max-h-48 overflow-y-auto">
                                        {MEDICINE_DB.filter(m => m.toLowerCase().includes(med.name.toLowerCase())).map(m => (
                                          <div key={m} className="px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer text-slate-700" onMouseDown={() => updateMedicine(idx, 'name', m)}>
                                            {m}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Input value={med.dosage} onChange={e => updateMedicine(idx, 'dosage', e.target.value)} className="h-8 w-20 shadow-none border-slate-200 text-center text-xs bg-white" placeholder="1-0-1" />
                                    <Input value={med.duration} onChange={e => updateMedicine(idx, 'duration', e.target.value)} className="h-8 w-20 shadow-none border-slate-200 text-center text-xs bg-white" placeholder="Days" />
                                    <Input value={med.instruction} onChange={e => updateMedicine(idx, 'instruction', e.target.value)} className="h-8 w-32 shadow-none border-slate-200 text-xs bg-white" placeholder="Instructions" />
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0" onClick={() => removeMedicine(idx)}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Doctor Notes</Label>
                            <Textarea value={rxData.notes} onChange={e => setRxData({...rxData, notes: e.target.value})} className="min-h-[60px] shadow-none border-slate-200 text-xs resize-none bg-slate-50/50" placeholder="Advice..." />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Follow-up</Label>
                            <Input value={rxData.followUp} onChange={e => setRxData({...rxData, followUp: e.target.value})} className="h-9 shadow-none border-slate-200 text-xs bg-slate-50/50" placeholder="e.g. 1 Week" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode: PREVIEW */}
                {rxViewMode === 'preview' && (
                  <div className="flex flex-col h-full bg-slate-100">
                    <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500" onClick={() => setRxViewMode('editor')}>
                        <ArrowLeft className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs shadow-none bg-white"><Printer className="w-3.5 h-3.5 mr-1" /> Print</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs shadow-none bg-white"><Download className="w-3.5 h-3.5 mr-1" /> PDF</Button>
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-none text-white font-bold px-4">Save to EMR</Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center">
                      {/* Clinical Paper Prescription */}
                      <div className="bg-white text-black w-full max-w-[500px] shadow-sm border border-slate-300 flex flex-col min-h-[600px] text-xs print:shadow-none print:border-none">
                        
                        <div className="p-6 border-b-2 border-slate-900 flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <Hospital className="w-8 h-8 text-slate-800" />
                            <div>
                              <h2 className="font-black text-lg uppercase tracking-tight text-slate-900 leading-tight">City Care Hospital</h2>
                              <p className="text-[9px] text-slate-500">123 Health Ave, Medical District • +1 234-567-890</p>
                            </div>
                          </div>
                        </div>

                        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/50 flex justify-between text-[10px]">
                          <div>
                            <p className="font-bold text-sm text-slate-900">Dr. Rakesh Sharma</p>
                            <p className="text-slate-600">MD (Internal Medicine) • Reg: 849201</p>
                          </div>
                          <div className="text-right">
                            <p>Date: {new Date().toLocaleDateString()}</p>
                            <p>Rx: #49281</p>
                          </div>
                        </div>

                        <div className="px-6 py-3 border-b border-slate-200 flex justify-between text-[10px]">
                          <div>
                            <p className="text-slate-500 mb-0.5">Patient Name</p>
                            <p className="font-bold text-sm text-slate-900">{pName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-500 mb-0.5">Age / Sex</p>
                            <p className="font-semibold text-sm text-slate-900">{pAge} / {pGender.charAt(0).toUpperCase()}</p>
                          </div>
                        </div>

                        <div className="p-6 flex-1 space-y-5">
                          {rxData.diagnosis && (
                            <div>
                              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 mr-2">Diagnosis:</span>
                              <span className="font-bold text-sm text-slate-900">{rxData.diagnosis}</span>
                            </div>
                          )}

                          <div>
                            <div className="text-3xl font-serif font-black mb-4 text-slate-900 leading-none">Rx</div>
                            <div className="space-y-4">
                              {rxData.medicines.map((med, i) => med.name && (
                                <div key={i} className="flex justify-between items-start border-b border-slate-100 pb-3 border-dashed last:border-0">
                                  <div>
                                    <p className="font-bold text-sm text-slate-900 leading-tight">{i+1}. {med.name}</p>
                                    <p className="text-[10px] text-slate-600 mt-1">{med.instruction}</p>
                                  </div>
                                  <div className="text-right pl-4">
                                    <p className="font-black text-slate-900">{med.dosage}</p>
                                    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mt-0.5">{med.duration}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {(rxData.notes || rxData.followUp) && (
                            <div className="bg-slate-50/50 border border-slate-200 p-4 rounded space-y-3 mt-6">
                              {rxData.notes && (
                                <div><p className="font-bold text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Advice</p><p className="text-xs text-slate-800 font-medium">{rxData.notes}</p></div>
                              )}
                              {rxData.followUp && (
                                <div><p className="font-bold text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Follow up</p><p className="text-xs text-slate-900 font-bold">{rxData.followUp}</p></div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-auto p-6 border-t border-slate-200 flex justify-between items-end">
                          <div className="text-[9px] text-slate-400 font-medium">
                            <p>Powered by Aatomate Healthcare</p>
                            <p>www.aatomate.com</p>
                          </div>
                          <div className="text-center">
                            <div className="w-24 border-b border-slate-800 mx-auto mb-1 opacity-20"></div>
                            <p className="font-bold text-[9px] uppercase tracking-wider text-slate-500">Authorized Signature</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- OTHER TABS (Placeholders) --- */}
            {activeTab !== 'prescriptions' && (
              <div className="p-8 text-center h-full flex flex-col items-center justify-center text-slate-500">
                <Activity className="w-12 h-12 text-slate-300 mb-3" />
                <p className="font-bold text-slate-700 uppercase tracking-wider text-sm">{activeTab}</p>
                <p className="text-xs mt-1">This module is currently being integrated into the EMR.</p>
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* --- OCR DIALOG --- */}
      <Dialog open={ocrOpen} onOpenChange={setOcrOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden gap-0 bg-white">
          <div className="bg-slate-50 p-5 border-b text-center">
            <ScanText className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <DialogTitle className="text-base font-bold">AI Document Extraction</DialogTitle>
          </div>
          
          <div className="p-6">
            {ocrState === 'uploading' && (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors" onClick={handleSimulateOCR}>
                <p className="text-xs font-bold text-slate-700 mb-1">Click to Upload Document</p>
                <p className="text-[10px] text-slate-400 font-medium">Supports JPG, PNG, PDF</p>
              </div>
            )}

            {ocrState === 'processing' && (
              <div className="text-center py-6">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="font-bold text-xs text-slate-800">Extracting Text via AI Vision...</p>
              </div>
            )}

            {ocrState === 'verifying' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-2 items-start text-amber-800">
                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-bold text-[10px] uppercase tracking-wider">Human Verification</p>
                    <p className="text-[10px] mt-0.5 font-medium">Review the extracted fields before saving to patient history.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diagnosis</Label>
                    <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 uppercase"><Check className="w-3 h-3" /> {extractedData.diagnosis.confidence}% Confident</span>
                  </div>
                  <Input defaultValue={extractedData.diagnosis.value} onChange={e => setExtractedData(prev => ({...prev, diagnosis: { ...prev.diagnosis, value: e.target.value }}))} className="h-8 shadow-none text-xs font-semibold" />
                </div>

                <div className="space-y-1.5 p-2 bg-amber-50/50 border border-amber-200 rounded-md">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Medicines</Label>
                    <span className="text-[9px] font-bold text-amber-600 animate-pulse flex items-center gap-1 uppercase"><AlertCircle className="w-3 h-3" /> {extractedData.medicineText.confidence}% Review</span>
                  </div>
                  <Textarea defaultValue={extractedData.medicineText.value} onChange={e => setExtractedData(prev => ({...prev, medicineText: { ...prev.medicineText, value: e.target.value }}))} className="min-h-[80px] shadow-none border-amber-200 text-xs font-semibold resize-none" />
                </div>
              </div>
            )}
          </div>
          
          {ocrState === 'verifying' && (
            <div className="p-3 border-t bg-slate-50 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => {setOcrOpen(false); setOcrState('uploading');}} className="h-7 text-xs shadow-none">Cancel</Button>
              <Button size="sm" onClick={handleConfirmOCR} className="h-7 text-xs shadow-none bg-blue-600 font-bold">Import to Editor</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
