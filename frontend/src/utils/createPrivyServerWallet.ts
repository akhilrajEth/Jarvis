import { supabase } from "./supabaseClient";
import { PrivyServerWallet } from "./types";

export default async function createPrivyServerWallet(
  userId: string
): Promise<PrivyServerWallet | null> {
  console.log("USER ID PASSED INTO CREATE PRIVY SERVER WALLET:", userId);
  try {
    // Call the server-side API to create the Privy server wallet
    const response = await fetch("/api/privy-server-wallet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create wallet: ${response.statusText}`);
    }

    const wallet: PrivyServerWallet = await response.json();

    console.log("WALLET FROM API:", wallet);

    // Update the user's privy_server_wallet column
    const { data, error } = await supabase
      .from("users")
      .update({ privy_server_wallet: wallet })
      .eq("id", userId);

    if (error) {
      console.error(
        "Error updating privy_server_wallet in database:",
        error.message
      );
      return null;
    }

    console.log("privy_server_wallet updated successfully:", data);
    return wallet;
  } catch (err) {
    console.error("Unexpected error in createPrivyServerWallet:", err);
    return null;
  }
}
