import { PrivyClient } from "@privy-io/server-auth";
import { PrivyServerWallet } from "./types";
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

async function main() {
  const newlyCreatedPrivyServerWallet = await createPrivyServerWallet();
  console.log("Newly Created Wallet:", newlyCreatedPrivyServerWallet);
}

main();
