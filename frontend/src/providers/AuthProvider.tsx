"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { UserProfile, Role, parseUserProfile, getRoleDashboardPath } from "@/lib/rbac";
import { switchActiveRole as apiSwitchRole } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  /** Switch the user's active role. Navigates to the new role's dashboard. */
  switchRole: (newRole: Role) => Promise<void>;
  /** True if the user has more than one role and can switch */
  canSwitchRoles: boolean;
  /** True if a role switch is currently in progress */
  switching: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  switchRole: async () => {},
  canSwitchRoles: false,
  switching: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const router = useRouter();

  // We access queryClient via a try-catch since AuthProvider is inside QueryClientProvider
  let queryClient: ReturnType<typeof useQueryClient> | null = null;
  try {
    queryClient = useQueryClient();
  } catch {
    // QueryClient not available (shouldn't happen with current provider order)
  }

  const buildProfile = useCallback((data: Record<string, any>): UserProfile => {
    const profile = parseUserProfile(data);
    // Persist to localStorage for the API interceptor
    localStorage.setItem("tenantId", profile.tenantId);
    localStorage.setItem("activeRole", profile.activeRole);
    return profile;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          await handleSession(session);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    async function handleSession(session: Session | null) {
      if (session?.user) {
        setUser(session.user);
        try {
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (data && !error) {
            const profile = buildProfile(data);
            setUserProfile(profile);
          } else {
            console.error("User profile not found in Supabase", error);
            localStorage.removeItem("tenantId");
            localStorage.removeItem("activeRole");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          localStorage.removeItem("tenantId");
          localStorage.removeItem("activeRole");
        }
      } else {
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem("tenantId");
        localStorage.removeItem("activeRole");
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          handleSession(session);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [buildProfile]);

  /**
   * Switch the user's active role.
   * 1. Calls the backend to persist the role change
   * 2. Updates the local UserProfile state
   * 3. Invalidates all React Query caches (data is role-specific)
   * 4. Navigates to the new role's dashboard
   */
  const switchRole = useCallback(async (newRole: Role) => {
    if (!userProfile) return;
    if (newRole === userProfile.activeRole) return;
    if (!userProfile.roles.includes(newRole)) {
      console.error(`Role "${newRole}" is not assigned to this user.`);
      return;
    }

    setSwitching(true);
    try {
      // 1. Call backend to persist the switch
      await apiSwitchRole(newRole);

      // 2. Update local state
      const updatedProfile: UserProfile = {
        ...userProfile,
        activeRole: newRole,
        role: newRole,  // backward compat
      };
      setUserProfile(updatedProfile);
      localStorage.setItem("activeRole", newRole);

      // 3. Invalidate all query caches — data is role-specific
      if (queryClient) {
        queryClient.invalidateQueries();
      }

      // 4. Navigate to the new role's dashboard
      const dashboardPath = getRoleDashboardPath(newRole);
      router.push(dashboardPath);
    } catch (error) {
      console.error("Failed to switch role:", error);
      throw error;
    } finally {
      setSwitching(false);
    }
  }, [userProfile, queryClient, router]);

  const canSwitch = userProfile ? userProfile.roles.length > 1 : false;

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      switchRole,
      canSwitchRoles: canSwitch,
      switching,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
