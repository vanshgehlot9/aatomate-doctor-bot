"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { UserProfile, Role } from "@/lib/rbac";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
            const profile: UserProfile = {
                uid: data.id,
                email: data.email,
                name: data.name,
                role: data.role as Role,
                tenantId: data.tenant_id,
                hospitalId: data.tenant_id
            };
            setUserProfile(profile);
            localStorage.setItem("tenantId", profile.tenantId);
          } else {
            console.error("User profile not found in Supabase", error);
            localStorage.removeItem("tenantId");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          localStorage.removeItem("tenantId");
        }
      } else {
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem("tenantId");
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
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
