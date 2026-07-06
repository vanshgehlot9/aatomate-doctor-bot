"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInvitationByToken, acceptInvitationWithEmail } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function InvitePage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"choose" | "email">("choose");

  useEffect(() => {
    async function loadInvite() {
      const res = await getInvitationByToken(token);
      if (res.error || !res.invitation) {
        setError(res.error || "Invalid invitation link.");
      } else {
        setInvitation(res.invitation);
      }
      setLoading(false);
    }
    loadInvite();
  }, [token]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    
    setIsSubmitting(true);
    const res = await acceptInvitationWithEmail(token, password);
    
    if (res.error) {
      toast.error(res.error);
      setIsSubmitting(false);
    } else {
      toast.success("Account created successfully!");
      router.push("/login");
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      // Store token in session storage to be picked up by the callback page
      sessionStorage.setItem("invite_token", token);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/invite/google-callback`
        }
      });
      
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Failed to start Google sign-in.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Invalid Invitation</h1>
          <p className="text-slate-500 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] space-y-8">
        
        {/* Branding */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl overflow-hidden relative mb-6 shadow-sm">
             <Image src="/aatomate.jpeg" alt="Aatomate Medical OS" fill className="object-cover" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">You've been invited!</h2>
          <p className="text-sm text-slate-500 mt-2">
            <strong>{invitation.tenants?.hospital_name || "A hospital"}</strong> has invited you to join their team as a <span className="capitalize font-medium text-slate-700">{invitation.role}</span>.
          </p>
        </div>

        {/* Main Panel */}
        <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          
          {mode === "choose" ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-700 mb-6 text-center">
                Choose how you want to sign in:
              </p>
              
              <Button 
                variant="outline" 
                className="w-full h-12 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl shadow-sm transition-all" 
                onClick={handleGoogleSignIn} 
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium">or</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl shadow-sm transition-all" 
                onClick={() => setMode("email")} 
                disabled={isSubmitting}
              >
                <Mail className="w-5 h-5 mr-3 text-slate-500" />
                Continue with Email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Email Address</Label>
                <Input 
                  type="email" 
                  value={invitation.email} 
                  disabled 
                  className="h-11 bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed rounded-xl"
                />
                <p className="text-xs text-slate-500">Your email is linked to this invitation.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">Create a Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="At least 6 characters" 
                  className="h-11 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                  required 
                  minLength={6}
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Account
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full mt-2 text-slate-500 hover:text-slate-700" 
                  onClick={() => setMode("choose")}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              </div>
            </form>
          )}

        </div>

        {/* Security Indicator */}
        <div className="flex flex-col items-center justify-center text-center space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Secure Invitation</span>
          </div>
        </div>

      </div>
    </div>
  );
}
