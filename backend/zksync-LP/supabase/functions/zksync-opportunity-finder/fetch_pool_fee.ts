import { ethers } from "npm:ethers@^6.7";

// Configuration
const RPC_URL =
  "https://zksync-mainnet.g.alchemy.com/v2/oQcwBviequQgqzvgAXUShhOlCzgZKtKK";

const provider = new ethers.JsonRpcProvider(RPC_URL);
// ABI fragment for the fee function
const POOL_ABI = [
  {
    inputs: [{ internalType: "bool", name: "tokenAIn", type: "bool" }],
    name: "fee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export async function getPoolFee(
  pool_address: string,
  tokenAIn: boolean = true
): Promise<number> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const poolContract = new ethers.Contract(pool_address, POOL_ABI, provider);

  try {
    const feeAmount: bigint = await poolContract.fee(tokenAIn);
    // Convert from 18-decimal fixed-point to percentage float
    return Number(feeAmount) / 1e16;
  } catch (error) {
    console.error("Error fetching fee:", error);
    throw error;
  }
}