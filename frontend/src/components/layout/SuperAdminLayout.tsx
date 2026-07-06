"use client";

import { useAuth } from "@/providers/AuthProvider";
import { EnterpriseSidebar } from "./EnterpriseSidebar";
import { EnterpriseHeader } from "./EnterpriseHeader";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";

export function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading || !user || !userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#111827] font-sans">
      <EnterpriseSidebar 
        userProfile={userProfile} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      <div className="flex flex-col min-h-screen md:pl-64 transition-all duration-300">
        <EnterpriseHeader 
          userProfile={userProfile} 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
        />
        <main className="flex-1 p-3 md:p-8 overflow-x-hidden">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
