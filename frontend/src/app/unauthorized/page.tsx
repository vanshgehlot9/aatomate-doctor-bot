"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Role } from "@/lib/rbac";

export default function UnauthorizedPage() {
  const { userProfile } = useAuth();

  const getDashboardLink = () => {
    switch (userProfile?.role) {
      case Role.SUPER_ADMIN:
        return "/super-admin";
      case Role.HOSPITAL_ADMIN:
        return "/admin";
      case Role.DOCTOR:
        return "/doctor";
      case Role.RECEPTIONIST:
      case Role.NURSE:
      case Role.LAB_TECHNICIAN:
      case Role.PHARMACIST:
      case Role.BILLING_EXECUTIVE:
      case Role.STAFF:
        return "/staff";
      default:
        return "/login";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="max-w-md w-full bg-card border rounded-lg shadow-sm p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You do not have the required permissions to view this page. Your current role is <strong className="text-foreground capitalize">{userProfile?.role?.replace("_", " ")}</strong>.
          </p>
        </div>

        <Link 
          href={getDashboardLink()}
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to your Dashboard
        </Link>
      </div>
    </div>
  );
}
