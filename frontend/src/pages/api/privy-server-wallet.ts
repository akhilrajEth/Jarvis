import type { NextApiRequest, NextApiResponse } from "next";
import { PrivyClient } from "@privy-io/server-auth";

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }

  try {
    // Create a new wallet
    const { id, address, chainType } = await privy.walletApi.create({
      chainType: "ethereum",
    });

    const wallet = {
      id,
      address,
      chain_type: chainType,
    };

    // Return the wallet object to the client
    return res.status(200).json(wallet);
  } catch (err) {
    console.error("Error creating Privy server wallet:", err);
    return res.status(500).json({ error: "Failed to create wallet" });
  }
}
