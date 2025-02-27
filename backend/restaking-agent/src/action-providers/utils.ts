import { EvmWalletProvider } from "@coinbase/agentkit";
import {
  ethers,
  TransactionLike,
  Transaction,
  JsonRpcProvider,
  Wallet,
  TransactionResponse,
  TransactionRequest,
} from "ethers";

interface SignAndBroadcastParams {
  txHex: string;
  gasLimit: bigint | string;
  maxFeeGas: string;
  maxPriorityFeeGas: string;
  amount: string;
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
    const rpcURL = "https://ethereum-holesky-rpc.publicnode.com";

    // const rpcURL = "https://1rpc.io/holesky";

    const provider: JsonRpcProvider = new ethers.JsonRpcProvider(rpcURL);

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
    // const txHash = await wallet.sendTransaction(txData, provider);
    await wallet.waitForTransactionReceipt(txHash);

    return `Transaction broadcasted successfully: ${txHash}`;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return `Transaction failed: ${errMsg}`;
  }
}
