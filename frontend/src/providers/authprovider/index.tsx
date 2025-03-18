"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";

interface AuthContextType {
  session: any;
  isLoading: boolean;
  hasExistingPrivyServerWallet: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingPrivyServerWallet, setHasExistingPrivyServerWallet] =
    useState(false);
  const router = useRouter();

  // Checks if user has a privy server wallet
  const checkPrivyServerWallet = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("privy_server_wallet")
        .eq("id", userId)
        .single();

      // Set the state based on whether privy_server_wallet is not null
      setHasExistingPrivyServerWallet(data?.privy_server_wallet !== null);
      return data?.privy_server_wallet !== null;
    } catch (err) {
      console.error("Error in checkPrivyServerWallet:", err);
      return false;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);

      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        setSession(supabaseSession);

        console.log("Auth Event:", event);
        console.log("SESSION OBJECT:", supabaseSession);

        if (
          (event === "SIGNED_UP" || event === "SIGNED_IN") &&
          supabaseSession
        ) {
          console.log("INSIDE IF STATEMENT FOR SIGNED UP OR SIGNED IN");
          console.log("User ID (UUID):", supabaseSession.user.id);

          // Check for privy server wallet when user signs in
          // await checkPrivyServerWallet(supabaseSession.user.id);

          router.push(event === "SIGNED_UP" ? "/riskprofile" : "/positions");
          // router.push("/riskprofile");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{ session, isLoading, hasExistingPrivyServerWallet }}
    >
      {children}
    </AuthContext.Provider>
  );
}
