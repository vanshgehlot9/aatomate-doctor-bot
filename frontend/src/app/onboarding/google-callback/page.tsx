"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { registerHospitalForGoogleUser } from "../actions";

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "registering" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // 1. Wait for Supabase to pick up the session from the URL hash/query
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError("Authentication failed. Please go back and try again.");
          setStatus("error");
          return;
        }

        const user = session.user;

        // 2. Get the onboarding token from query params
        const token = searchParams.get("token");
        if (!token) {
          setError("Missing onboarding session token. Please start from the beginning.");
          setStatus("error");
          return;
        }

        // 3. Read saved form data from sessionStorage
        let formData: any = null;
        try {
          const saved = sessionStorage.getItem("onboarding_form_data");
          if (saved) formData = JSON.parse(saved);
        } catch {
          // sessionStorage unavailable
        }

        if (!formData || !formData.hospitalName) {
          setError("Your onboarding data was not found. Please go back and fill in the hospital details again.");
          setStatus("error");
          return;
        }

        setStatus("registering");

        // 4. Register the hospital using the Google user's ID
        const userName = user.user_metadata?.full_name || user.email || "Admin";
        const res = await registerHospitalForGoogleUser(
          user.id,
          user.email!,
          userName,
          formData,
          token
        );

        if (res.error) {
          setError(res.error);
          setStatus("error");
          return;
        }

        // 5. Clean up sessionStorage and redirect
        try {
          sessionStorage.removeItem("onboarding_form_data");
          sessionStorage.removeItem("onboarding_token");
        } catch {}

        router.replace("/login");
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
        setStatus("error");
      }
    }

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#080d14] flex items-center justify-center p-4">
      <div className="text-center max-w-sm w-full">
        {status === "loading" && (
          <>
            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold text-lg">Signing you in with Google...</p>
            <p className="text-white/40 text-sm mt-2">Please wait a moment</p>
          </>
        )}

        {status === "registering" && (
          <>
            <div className="w-12 h-12 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold text-lg">Setting up your hospital...</p>
            <p className="text-white/40 text-sm mt-2">Creating your account and subscription</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-white font-semibold text-lg mb-2">Something went wrong</p>
            <p className="text-red-400 text-sm mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080d14] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
