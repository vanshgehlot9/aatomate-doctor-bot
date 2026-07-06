"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

function ConsentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  
  const [authorizationId, setAuthorizationId] = useState<string | null>(null);
  const [authDetails, setAuthDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authId = searchParams.get("authorization_id");
    if (!authId) {
      setError("No authorization_id found in the URL.");
      setLoading(false);
      return;
    }
    setAuthorizationId(authId);
  }, [searchParams]);

  useEffect(() => {
    async function fetchAuthDetails() {
      if (!authorizationId || authLoading) return;

      if (!userProfile) {
        setError("You must be logged in to grant access. Please go back to the application and sign in first.");
        setLoading(false);
        return;
      }

      try {
        // @ts-ignore - The types might not be updated for the new OAuth server feature yet
        if (supabase.auth.oauth && supabase.auth.oauth.getAuthorizationDetails) {
            // @ts-ignore
            const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
            if (error) throw error;
            setAuthDetails(data);
        } else {
             setError("OAuth Server methods are not available in this Supabase client version.");
        }
      } catch (err: any) {
        console.error("Error fetching auth details:", err);
        setError(err.message || "Failed to fetch authorization details.");
      } finally {
        setLoading(false);
      }
    }

    fetchAuthDetails();
  }, [authorizationId, userProfile, authLoading]);

  const handleApprove = async () => {
    if (!authorizationId) return;
    setProcessing(true);
    try {
      // @ts-ignore
      const { data, error } = await supabase.auth.oauth.approveAuthorization(authorizationId);
      if (error) throw error;
      const resData = data as any;
      if (resData?.url) {
        window.location.href = resData.url;
      } else if (resData?.redirect_to) {
        window.location.href = resData.redirect_to;
      } else {
        toast.success("Authorization approved successfully!");
      }
    } catch (err: any) {
      console.error("Error approving:", err);
      toast.error(err.message || "Failed to approve authorization.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!authorizationId) return;
    setProcessing(true);
    try {
      // @ts-ignore
      const { data, error } = await supabase.auth.oauth.denyAuthorization(authorizationId);
      if (error) throw error;
      const resData = data as any;
      if (resData?.url) {
        window.location.href = resData.url;
      } else if (resData?.redirect_to) {
        window.location.href = resData.redirect_to;
      } else {
        toast.info("Authorization denied.");
      }
    } catch (err: any) {
      console.error("Error denying:", err);
      toast.error(err.message || "Failed to deny authorization.");
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Authorization Error</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <Button onClick={() => router.push("/login")} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 sm:p-10 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-[440px] w-full relative">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden relative mx-auto mb-5 shadow-sm flex items-center justify-center">
             <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
            Authorization Request
          </h2>
          <p className="text-sm text-slate-500">
            A third-party application is requesting access to your Aatomate account.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
          <p className="text-sm text-blue-900 font-medium mb-1">
            Signed in as:
          </p>
          <p className="text-sm text-blue-700">
            {userProfile?.name} ({userProfile?.email})
          </p>
          
          {authDetails?.scopes && authDetails.scopes.length > 0 && (
             <div className="mt-3 pt-3 border-t border-blue-200/50 text-left">
                <p className="text-[13px] font-medium text-blue-900 mb-1">Requested permissions:</p>
                <ul className="list-disc pl-4 text-[12px] text-blue-800">
                   {authDetails.scopes.map((scope: string) => (
                      <li key={scope}>{scope}</li>
                   ))}
                </ul>
             </div>
          )}
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleApprove} 
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-all" 
            disabled={processing}
          >
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve Access
          </Button>
          <Button 
            onClick={handleDeny} 
            variant="outline" 
            className="w-full h-11 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl shadow-sm transition-all" 
            disabled={processing}
          >
            Cancel & Deny
          </Button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-slate-400 font-medium">
        Secured by Aatomate Medical OS
      </div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <ConsentContent />
    </Suspense>
  );
}
