"use client";

import { useAuth } from "@/providers/AuthProvider";
import { Topbar } from "./topbar";
import { DynamicSidebar } from "./DynamicSidebar";
import { Loader2 } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();

  if (loading || !user || !userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <DynamicSidebar userProfile={userProfile} />
      <div className="flex flex-col min-h-screen md:ml-64">
        <Topbar userProfile={userProfile} />
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
