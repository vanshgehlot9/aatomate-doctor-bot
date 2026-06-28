"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type PortalRole = "SUPER_ADMIN" | "BUSINESS_ADMIN" | "VENDOR" | "STAFF";

export type PortalAuthConfig = {
  role: PortalRole;
  storageKey: string;
  cookieName: string;
  loginPath: string;
};

type PortalAuthState = {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  setSession: (token: string) => void;
};

function readCookie(cookieName: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((item) => item.startsWith(`${cookieName}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function createPortalAuth(config: PortalAuthConfig) {
  const PortalAuthContext = createContext<PortalAuthState | undefined>(undefined);

  function PortalAuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
      const storedToken = localStorage.getItem(config.storageKey);
      const cookieToken = readCookie(config.cookieName);
      const activeToken = storedToken || cookieToken;
      if (activeToken) {
        setToken(activeToken);
        if (storedToken !== activeToken) {
          localStorage.setItem(config.storageKey, activeToken);
        }
      }
    }, []);

    const value = useMemo<PortalAuthState>(() => ({
      token,
      isAuthenticated: Boolean(token),
      setSession: (nextToken: string) => {
        localStorage.setItem(config.storageKey, nextToken);
        setToken(nextToken);
      },
      logout: () => {
        localStorage.removeItem(config.storageKey);
        document.cookie = `${config.cookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
        setToken(null);
      },
    }), [token]);

    return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
  }

  function usePortalAuth() {
    const context = useContext(PortalAuthContext);
    if (!context) {
      throw new Error(`usePortalAuth must be used within ${config.role} provider`);
    }
    return context;
  }

  return { PortalAuthProvider, usePortalAuth, config };
}

export const SuperAdminAuth = createPortalAuth({
  role: "SUPER_ADMIN",
  storageKey: "superAdminAuthToken",
  cookieName: "super_admin_session",
  loginPath: "/super-admin/login",
});

export const BusinessAuth = createPortalAuth({
  role: "BUSINESS_ADMIN",
  storageKey: "businessAuthToken",
  cookieName: "business_session",
  loginPath: "/business/login",
});

export const VendorAuth = createPortalAuth({
  role: "VENDOR",
  storageKey: "vendorAuthToken",
  cookieName: "vendor_session",
  loginPath: "/vendor/login",
});

export const StaffAuth = createPortalAuth({
  role: "STAFF",
  storageKey: "staffAuthToken",
  cookieName: "staff_session",
  loginPath: "/staff/login",
});
