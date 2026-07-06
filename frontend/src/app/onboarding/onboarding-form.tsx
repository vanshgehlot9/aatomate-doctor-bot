"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Building, MapPin, User, ShieldCheck } from "lucide-react";
import { registerHospital } from "./actions";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function OnboardingForm({ paymentData, token }: { paymentData: any, token: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Hospital
    hospitalName: "",
    hospitalType: "Clinic",
    hospitalRegNo: "",
    hospitalGst: "",
    hospitalEmail: paymentData.email || "",
    hospitalPhone: "",
    website: "",
    // Address
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    // Admin
    adminName: "",
    adminDesignation: "Owner",
    adminPhone: "",
    // Size
    doctorsCount: "1-5",
    // Auth
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerHospital(formData, token);
      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else {
        router.push("/login");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    // Save form data and token to sessionStorage so we can complete registration
    // after the Google OAuth redirect brings us back
    try {
      sessionStorage.setItem("onboarding_form_data", JSON.stringify(formData));
      sessionStorage.setItem("onboarding_token", token);
    } catch {
      // sessionStorage not available
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboarding/google-callback?token=${encodeURIComponent(token)}`
      }
    });

    if (error) {
      setError(error.message || "Failed to sign in with Google");
      setGoogleLoading(false);
    }
    // On success, the browser redirects — no further code runs here
  };

  const steps = [
    { num: 1, title: "Hospital", icon: Building },
    { num: 2, title: "Address", icon: MapPin },
    { num: 3, title: "Admin", icon: User },
    { num: 4, title: "Secure", icon: ShieldCheck },
  ];

  return (
    <div className="w-full">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-white/10 z-0" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-blue-500 z-0 transition-all duration-300"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        />
        
        {steps.map((s) => (
          <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${step >= s.num ? "bg-blue-500 border-blue-500 text-white" : "bg-[#111] border-white/20 text-white/50"}`}>
              {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${step >= s.num ? "text-blue-500" : "text-white/40"}`}>{s.title}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium mb-6">
          {error}
        </div>
      )}

      <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {step === 1 && (
              <>
                <h2 className="text-xl font-bold mb-2">Hospital Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-white/50 font-bold">Hospital Name *</label>
                    <input required name="hospitalName" value={formData.hospitalName} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-white/50 font-bold">Hospital Type *</label>
                    <select required name="hospitalType" value={formData.hospitalType} onChange={handleChange} className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none">
                      <option>Clinic</option>
                      <option>Multi-speciality Hospital</option>
                      <option>Dental Clinic</option>
                      <option>Diagnostic Center</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-white/50 font-bold">Email *</label>
                    <input required type="email" name="hospitalEmail" value={formData.hospitalEmail} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-white/50 font-bold">Phone *</label>
                    <input required type="tel" name="hospitalPhone" value={formData.hospitalPhone} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-white/50 font-bold">Registration Number (Optional)</label>
                    <input name="hospitalRegNo" value={formData.hospitalRegNo} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-white/50 font-bold">Doctors Count</label>
                    <select required name="doctorsCount" value={formData.doctorsCount} onChange={handleChange} className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none">
                      <option>1-5</option>
                      <option>6-10</option>
                      <option>11-20</option>
                      <option>21-50</option>
                      <option>50+</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-xl font-bold mb-2">Address</h2>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-white/50 font-bold">Address Line 1 *</label>
                    <input required name="addressLine1" value={formData.addressLine1} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase text-white/50 font-bold">City *</label>
                      <input required name="city" value={formData.city} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase text-white/50 font-bold">State *</label>
                      <input required name="state" value={formData.state} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase text-white/50 font-bold">Pincode *</label>
                      <input required name="pincode" value={formData.pincode} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase text-white/50 font-bold">Country *</label>
                      <input required name="country" value={formData.country} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-xl font-bold mb-2">Administrator Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-white/50 font-bold">Full Name *</label>
                    <input required name="adminName" value={formData.adminName} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-white/50 font-bold">Designation *</label>
                    <input required name="adminDesignation" value={formData.adminDesignation} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs uppercase text-white/50 font-bold">Mobile Number *</label>
                    <input required type="tel" name="adminPhone" value={formData.adminPhone} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="text-xl font-bold mb-2">Create Account</h2>

                {/* Google Sign-In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || isSubmitting}
                  className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 px-4 py-3 rounded-xl font-semibold transition-all hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {googleLoading ? (
                    <svg className="w-4 h-4 animate-spin text-gray-600" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  {googleLoading ? "Redirecting to Google..." : "Continue with Google"}
                </button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#0f172a] px-3 text-white/40 font-medium uppercase tracking-wider">or set a password</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-white/50 font-bold">Login Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-white/50 font-bold">Password *</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-white/50 font-bold">Confirm Password *</label>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
          {step > 1 ? (
            <button type="button" onClick={handleBack} disabled={isSubmitting} className="px-6 py-3 rounded-xl font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50">
              Back
            </button>
          ) : (
            <div />
          )}
          
          {/* Only show the submit button if on step 4 AND user has typed email/password, or on steps 1-3 */}
          {step < 4 ? (
            <button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-400 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-70 flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || !formData.email || !formData.password}
              className="bg-blue-500 hover:bg-blue-400 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              {isSubmitting ? "Processing..." : "Complete Setup"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  );
}

