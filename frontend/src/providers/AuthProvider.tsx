"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setUserProfile(profile);
            localStorage.setItem("tenantId", profile.tenantId);
          } else {
            console.error("User profile not found in Firestore");
            localStorage.removeItem("tenantId");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          localStorage.removeItem("tenantId");
        }
      } else {
        setUserProfile(null);
        localStorage.removeItem("tenantId");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
