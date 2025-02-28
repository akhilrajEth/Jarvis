import { EvmWalletProvider } from "@coinbase/agentkit";
import {
  ethers,
  TransactionLike,
  Transaction,
  JsonRpcProvider,
  Wallet,
  TransactionResponse,
  TransactionRequest,
  Contract,
} from "ethers";

interface SignAndBroadcastParams {
  txHex: string;
  gasLimit: bigint | string;
  maxFeeGas: string;
  maxPriorityFeeGas: string;
  amount: string;
}

// ABI of the contract (only including necessary functions)
const abi = [
  {
    inputs: [],
    name: "isPaused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalDeposits",
    outputs: [{ internalType: "uint256", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

// Contract address
const contractAddress = "0xff7584928023CC991D255D4F1E36E9C6B7B8FEeE";

// RPC URL
// const rpcURL = "https://ethereum-holesky-rpc.publicnode.com"; // Public RPC
const rpcURL = "https://holesky.drpc.org";
// Initialize provider
const provider: JsonRpcProvider = new ethers.JsonRpcProvider(rpcURL);

// Create contract instance
const contract = new ethers.Contract(contractAddress, abi, provider);

/**
 * Fetches the contract balance
 * @returns Promise<string> The balance in Ether
 */
export async function fetchContractBalance(): Promise<string> {
  try {
    const balance = await provider.getBalance(contractAddress);
    return ethers.formatEther(balance); // Convert Wei to Ether
  } catch (error) {
    console.error("Error fetching contract balance:", error);
    throw error;
  }
}

/**
 * Fetches the isPaused status of the contract
 * @returns Promise<boolean> The paused status
 */
export async function fetchIsPaused(): Promise<boolean> {
  try {
    return await contract.isPaused();
  } catch (error) {
    console.error("Error querying isPaused:", error);
    throw error;
  }
}

/**
 * Signs and broadcasts a transaction using EvmWalletProvider
 *
 * @param wallet - Initialized EvmWalletProvider instance
 * @param params - Transaction parameters matching original function signature
 * @returns Transaction hash or error message
 */
export async function signAndBroadcast(
  wallet: EvmWalletProvider,
  params: SignAndBroadcastParams,
): Promise<string> {
  console.log("Started signing and broadcasting transaction");
  try {
    console.log("PARAMS:", params);
    console.log("TX HEX:", params.txHex);
    // Parse transaction from hex string
    const tx: Transaction = ethers.Transaction.from(params.txHex as TransactionLike);

    const walletAddress = wallet.getAddress();
    console.log("Wallet Address:", walletAddress);
    // Get network details
    const { chainId } = await provider.getNetwork();
    const nonce: number = await provider.getTransactionCount(walletAddress);

    // Prepare transaction data with proper types
    const txData = {
      to: tx.to,
      data: tx.data,
      chainId: Number(chainId),
      value: params.amount,
      gasLimit: params.gasLimit,
      type: 2,
      nonce: nonce,
      maxFeePerGas: ethers.parseUnits(params.maxFeeGas, "wei"),
      maxPriorityFeePerGas: ethers.parseUnits(params.maxPriorityFeeGas, "wei"),
    };

    const txHash = await wallet.sendTransaction(txData);
    await wallet.waitForTransactionReceipt(txHash);

    return `Transaction broadcasted successfully: ${txHash}`;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return `Transaction failed: ${errMsg}`;
  }
}
