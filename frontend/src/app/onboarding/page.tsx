import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { token } = await searchParams;

  if (!token || typeof token !== "string") {
    return <InvalidTokenError />;
  }

  const secret = process.env.ONBOARDING_JWT_SECRET || "fallback_secret_for_dev_only";
  let payload: any;

  try {
    // Verify the JWT token
    payload = jwt.verify(token, secret);
  } catch (error) {
    console.error("Token validation error:", error);
    return <InvalidTokenError />;
  }

  // The payload contains the payment info (payment_id, plan_id, plan_name, etc)
  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-[#111] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
        
        <div className="relative z-10">
          <div className="mb-8 border-b border-white/10 pb-6">
            <h1 className="text-3xl font-bold mb-2">Hospital Onboarding</h1>
            <p className="text-white/60">
              Complete your profile to activate your {payload.plan_name} subscription and access the Medical OS.
            </p>
          </div>

          <OnboardingForm paymentData={payload} token={token} />
        </div>
      </div>
    </div>
  );
}

function InvalidTokenError() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#111] border border-red-500/30 rounded-2xl p-8 text-center shadow-[0_0_40px_rgba(220,38,38,0.1)]">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-3 text-red-50">Invalid or Expired Session</h2>
        <p className="text-red-200/70 mb-8 text-sm">
          Your onboarding link is invalid or has expired for security reasons. Please ensure you have completed your payment on the main website.
        </p>
        <div className="flex flex-col gap-3">
          <a href="https://aatomate.com/pricing" className="w-full bg-white text-black font-bold py-3 px-4 rounded-xl hover:bg-white/90 transition-colors">
            Return to Pricing
          </a>
          <a href="mailto:support@aatomate.com" className="w-full bg-white/5 text-white font-medium py-3 px-4 rounded-xl hover:bg-white/10 transition-colors border border-white/10">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
