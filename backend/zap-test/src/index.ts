import { ethers } from "ethers";
import {
  Contract,
  JsonRpcProvider,
  Provider,
  TransactionReceipt,
  TransactionRequest,
  Interface,
  MaxUint256,
  Wallet,
} from "ethers";

// Types for our parameters
interface ZapInParams {
  poolId: string;
  tokenIn: string;
  amountIn: string;
  tickLower: number;
  tickUpper: number;
  slippage?: number; // Optional slippage in basis points (0.01%)
  senderAddress: string;
  recipientAddress?: string; // Optional, defaults to sender
}

// Response types
interface ZapInRouteResponse {
  route: string;
  routerAddress: string;
  gas: string;
}

interface ZapInBuildResponse {
  routerAddress: string;
  callData: string;
  value: string;
}

/**
 * Creates a UniswapV3 LP position on Base chain using KyberSwap's Zap API
 * @param params Parameters for zapping into a UniswapV3 pool
 * @param provider An ethers.js provider
 * @param privateKey Private key for transaction signing
 * @returns Transaction receipt
 */
async function createUniswapV3LpPositionOnBase(
  params: ZapInParams,
  provider: Provider,
  privateKey: string
): Promise<TransactionReceipt> {
  // Create wallet from private key
  const wallet = new Wallet(privateKey, provider);

  // 1. Get the best zap-in route
  const routeResponse = await getZapInRoute(params);

  // 2. Check and approve token allowance if needed
  if (params.tokenIn !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
    await approveTokenIfNeeded(
      params.tokenIn,
      routeResponse.routerAddress, // The router address returned from the API
      params.amountIn,
      wallet
    );
  }

  // 3. Build the transaction data
  const buildResponse = await buildZapInRoute({
    route: routeResponse.route,
    sender: params.senderAddress,
    recipient: params.recipientAddress || params.senderAddress,
  });

  // 4. Prepare transaction
  const txRequest: TransactionRequest = {
    to: buildResponse.routerAddress,
    data: buildResponse.callData,
    value:
      params.tokenIn === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        ? BigInt(buildResponse.value)
        : BigInt(0),
    gasLimit: Math.floor(Number(BigInt(routeResponse.gas)) * 1.2), // Add 20% buffer to estimated gas
  };

  // 5. Send transaction
  const tx = await wallet.sendTransaction(txRequest);
  console.log(`Transaction sent: ${tx.hash}`);

  // 6. Wait for transaction to be mined
  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block ${receipt?.blockNumber}`);

  return receipt as TransactionReceipt;
}

/**
 * Gets the best zap-in route from the KyberSwap API
 */
async function getZapInRoute(params: ZapInParams): Promise<ZapInRouteResponse> {
  const baseUrl = "https://zap-api.kyberswap.com/base";
  const endpoint = "/api/v1/in/route";

  // Build query parameters
  const queryParams = new URLSearchParams({
    dex: "DEX_UNISWAPV3",
    "pool.id": params.poolId,
    "position.tickLower": params.tickLower.toString(),
    "position.tickUpper": params.tickUpper.toString(),
    tokensIn: params.tokenIn,
    amountsIn: params.amountIn,
    slippage: (params.slippage || 100).toString(), // Default to 1% slippage (100 basis points)
  });

  // Make the API request
  const response = await fetch(
    `${baseUrl}${endpoint}?${queryParams.toString()}`,
    {
      method: "GET",
      headers: {
        "X-Client-Id": "jarvis4", // Your client ID
      },
    }
  );

  if (!response.ok) {
    console.log("INSIDE RESPONSE NOT OK");
    const errorData = await response.json();
    throw new Error(
      `Failed to get zap route: ${errorData.message || response.statusText}`
    );
  }

  const data = await response.json();

  console.log("DATA", data);
  // Check if the API returned an error
  if (data.message !== "OK") {
    throw new Error(`API error: ${data.message}`);
  }

  return {
    route: data.data.route,
    routerAddress:
      data.data.routerAddress || "0x0e97C887b61cCd952a53578B04763E7134429e05", // Use the provided router address
    gas: data.data.gas || "3000000", // Default gas estimate if not provided
  };
}

/**
 * Builds the zap-in transaction data
 */
interface BuildZapInRouteParams {
  route: string;
  sender: string;
  recipient: string;
  deadline?: number; // Optional deadline timestamp
}

async function buildZapInRoute(
  params: BuildZapInRouteParams
): Promise<ZapInBuildResponse> {
  const baseUrl = "https://zap-api.kyberswap.com/base";
  const endpoint = "/api/v1/in/route/build";

  // Calculate deadline if not provided (default to 20 minutes from now)
  const deadline = params.deadline || Math.floor(Date.now() / 1000) + 20 * 60;

  // Prepare request body
  const requestBody = {
    sender: params.sender,
    recipient: params.recipient,
    route: params.route,
    deadline: deadline,
    source: "jarvis4-integration", // Your source identifier
  };

  // Make the API request
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": "jarvis4", // Your client ID
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to build zap route: ${errorData.message || response.statusText}`
    );
  }

  const data = await response.json();

  // Check if the API returned an error
  if (data.message !== "OK") {
    throw new Error(`API error: ${data.message}`);
  }

  return {
    routerAddress:
      data.data.routerAddress || "0x0e97C887b61cCd952a53578B04763E7134429e05", // Use the provided router address
    callData: data.data.callData,
    value: data.data.value || "0",
  };
}

/**
 * Checks if the router has sufficient allowance to spend the user's tokens
 */
async function checkAllowance(
  tokenAddress: string,
  ownerAddress: string,
  routerAddress: string,
  amount: string,
  provider: Provider
): Promise<boolean> {
  console.log("INSIDE CHECK ALLOWANCE");
  // Skip allowance check for native ETH
  if (tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
    return true;
  }

  // ERC20 interface for allowance check
  const erc20Interface = new Interface([
    "function allowance(address owner, address spender) view returns (uint256)",
  ]);

  const tokenContract = new Contract(tokenAddress, erc20Interface, provider);
  const allowance = await tokenContract.allowance(ownerAddress, routerAddress);

  return BigInt(allowance) >= BigInt(amount);
}

/**
 * Approves the router to spend tokens if needed
 */
async function approveTokenIfNeeded(
  tokenAddress: string,
  routerAddress: string,
  amount: string,
  wallet: Wallet
): Promise<TransactionReceipt | null> {
  console.log("INSIDE APPROVE TOKEN IF NEEDED");
  const hasAllowance = await checkAllowance(
    tokenAddress,
    wallet.address,
    routerAddress,
    amount,
    wallet.provider
  );

  if (!hasAllowance) {
    console.log(
      `Approving ${routerAddress} to spend ${amount} of token ${tokenAddress}`
    );

    // ERC20 interface for approval
    const erc20Interface = new Interface([
      "function approve(address spender, uint256 amount) returns (bool)",
    ]);

    const tokenContract = new Contract(tokenAddress, erc20Interface, wallet);

    // Send approval transaction
    const tx = await tokenContract.approve(
      routerAddress,
      MaxUint256 // Approve maximum amount to avoid future approvals
    );

    console.log(`Approval transaction sent: ${tx.hash}`);

    // Wait for approval transaction to be mined
    const receipt = await tx.wait();
    console.log(`Approval confirmed in block ${receipt?.blockNumber}`);

    return receipt as TransactionReceipt;
  }

  console.log("Token already approved");
  return null;
}

/**
 * Example usage with ethers.js
 */
async function exampleUsage() {
  // Set up provider
  const provider = new JsonRpcProvider("https://mainnet.base.org");

  // Your private key (NEVER hardcode in production code)
  const privateKey =
    "0x4486754811a5cc822b055b131b3297ebec917a472ec3b5c8fb8264748738f543";

  // Zap parameters
  const zapParams: ZapInParams = {
    poolId: "0xd0b53D9277642d899DF5C87A3966A349A798F224",
    tokenIn: "0x4200000000000000000000000000000000000006", // WETH
    amountIn: "1130000000000000", // 0.00113 ETH
    tickLower: 143930,
    tickUpper: 151030,
    slippage: 100, // 1%
    senderAddress: "0x728d820C813e7cD9652C99355160480f9282A5Ab",
  };

  try {
    // Create LP position
    const receipt = await createUniswapV3LpPositionOnBase(
      zapParams,
      provider,
      privateKey
    );
    console.log("Transaction successful!", receipt);
  } catch (error) {
    console.error("Error creating LP position:", error);
  }
}

(async () => {
  try {
    await exampleUsage();
    console.log("Zap operation completed successfully");
  } catch (error) {
    console.error("Error executing zap operation:", error);
    process.exit(1); // Exit with error code
  }
})();
