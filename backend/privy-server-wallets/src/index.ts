import { PrivyClient } from "@privy-io/server-auth";
import { PrivyServerWallet } from "./types";
import { supabase } from "./supabaseClient";

import * as dotenv from "dotenv";

dotenv.config();

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

async function createPrivyServerWallet(): Promise<PrivyServerWallet> {
  try {
    const { id, address, chainType } = await privy.walletApi.create({
      chainType: "ethereum",
    });

    return { id, address, chainType };
  } catch (error) {
    console.error("Wallet creation failed:", error);
    throw error;
  }
}

export async function createUserWithWallet(
  walletInfo: PrivyServerWallet
): Promise<boolean> {
  console.log("Currently creating a new user with privy server wallet");

  const { data, error } = await supabase
    .from("users")
    .insert({
      privy_server_wallet_info: {
        id: walletInfo.id,
        address: walletInfo.address,
        chain_type: walletInfo.chainType,
      },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`User creation failed: ${error.message}`);
  }

  return true;
}

// To-Do: Convert this into an API endpoint for our frontend to hit
async function main() {
  const newlyCreatedPrivyServerWallet = await createPrivyServerWallet();
  console.log("Newly Created Wallet:", newlyCreatedPrivyServerWallet);
  const hasCreatedNewUser = await createUserWithWallet(
    newlyCreatedPrivyServerWallet
  );

  if (hasCreatedNewUser) {
    console.log("Successfully created new user in db");
  }
}

main();
