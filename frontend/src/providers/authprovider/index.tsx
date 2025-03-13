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

  // Checks if user has an existing privy server wallet
  const checkPrivyServerWallet = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("privy_server_wallet")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error checking privy server wallet:", error);
        return false;
      }

      console.log("PRIVY SERVER WALLET:", data?.privy_server_wallet);
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

     