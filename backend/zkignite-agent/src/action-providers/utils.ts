import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { encodeFunctionData } from "viem";
import { EvmWalletProvider } from "@coinbase/agentkit";
import dotenv from "dotenv";
import { supabase } from "./supabaseClient";

dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const BASE_URL = "https://api.geckoterminal.com/api/v2";

type TokenPricesResponse = Record<string, string>;

interface Position {
  userId: string;
  poolAddress: string;
  token0Address: string;
  token1Address: string;
  token0LiquidityAmount: number;
  token1LiquidityAmount: number;
  tokenId: string;
  token0InitialPrice: number;
  token1InitialPrice: number;
}

interface SupabasePosition {
  token_id: string;
  pool_address: string;
}

/**
 * Approves a spender to spend tokens on behalf of the owner
 *
 * @param wallet - The wallet provider
 * @param tokenAddress - The address of the token contract
 * @param spenderAddress - The address of the spender
 * @param amount - The amount to approve in atomic units (wei)
 * @returns A success message or error message
 */
export async function approve(
  wallet: EvmWalletProvider,
  tokenAddress: string,
  spenderAddress: string,
  amount: bigint,
): Promise<string> {
  console.log("APPROVE IS CALLED");
  try {
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spenderAddress as `0x${string}`, amount],
    });

    const txHash = await wallet.sendTransaction({
      to: tokenAddress as `0x${string}`,
      data,
    });

    await wallet.waitForTransactionReceipt(txHash);

    return `Successfully approved ${spenderAddress} to spend ${amount} tokens`;
  } catch (error) {
    return `Error approving tokens: ${error}`;
  }
}

/**
 * Scales a gas estimate by a given multiplier.
 *
 * This function converts the gas estimate to a number, applies the multiplier,
 * rounds the result to the nearest integer, and returns it as a bigint.
 *
 * @param gas - The original gas estimate (bigint).
 * @param multiplier - The factor by which to scale the estimate.
 * @returns The adjusted gas estimate as a bigint.
 */
export function applyGasMultiplier(gas: bigint, multiplier: number): bigint {
  return BigInt(Math.round(Number(gas) * multiplier));
}

/**
 * Functions to remove active positions from supabase and dynamo db
 */

export async function removeActivePositionFromSupabase(
  userId: string,
  tokenId: string,
): Promise<string> {
  console.log("Currently removing position from user's positions array in supabase:", tokenId);

  try {
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("positions")
      .eq("id", userId);

    if (fetchError) throw fetchError;

    // Check if user exists
    if (!userData || userData.length === 0) {
      throw new Error(`No user found with ID ${userId}`);
    }

    const userPositions = userData[0]?.positions || ([] as SupabasePosition[]);

    // Filter out the position to remove
    const updatedPositions = userPositions.filter(
      (position: SupabasePosition) => !(position.token_id === tokenId),
    );

    // If no positions were removed, throw an error
    if (updatedPositions.length === userPositions.length) {
      throw new Error(`Position not found for tokenId ${tokenId}`);
    }

    // Update the user's positions array
    const { data, error } = await supabase
      .from("users")
      .update({ positions: updatedPositions })
      .eq("id", userId)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error(`Failed to update user with ID ${userId}`);
    }

    console.log("Successfully removed position from user's positions array");

    return JSON.stringify({
      success: true,
      token_id: tokenId,
    });
  } catch (error: any) {
    console.error("Error removing active position in Supabase:", error);
    return JSON.stringify({
      success: false,
      error: {
        message: error.message,
        type: "POSITION_REMOVAL_ERROR",
        details: {
          token_id: tokenId,
        },
      },
    });
  }
}

export async function deleteActivePositionInDynamo(
  userId: string,
  tokenId: string,
): Promise<string> {
  console.log("Currently removing position from dynamo db:", tokenId);
  const params = {
    TableName: "positions",
    Key: {
      userId: userId,
      tokenId: tokenId,
    },
  };

  try {
    const command = new DeleteCommand(params);
    await docClient.send(command);
    console.log("Position deleted successfully with tokenId:", tokenId);
    return JSON.stringify({
      success: true,
      token_id: tokenId,
    });
  } catch (error: any) {
    console.error("Error deleting position:", error);
    return JSON.stringify({
      success: false,
      error: {
        message: error.message,
        type: "POSITION_REMOVAL_ERROR",
        details: {
          token_id: tokenId,
        },
      },
    });
  }
}

/**
 * Main function to add active positions in dynamo db + helper functions
 */

async function getTokenPrices(addresses: string[]): Promise<TokenPricesResponse> {
  const network = "zksync";
  try {
    const endpoint = `/simple/networks/${network}/token_price/${addresses.join(",")}`;
    const url = `${BASE_URL}${endpoint}`;

    const response = await axios.get(url);

    console.log("RESPONSE DATA:", response.data.data.attributes.token_prices);
    return response.data.data.attributes.token_prices;
  } catch (error) {
    console.error("Error fetching token prices:", error);
    throw error;
  }
}

async function putPosition(position: Position): Promise<void> {
  const params = {
    TableName: "positions",
    Item: position,
  };

  try {
    const command = new PutCommand(params);
    await docClient.send(command);
    console.log("Position added successfully:", position);
  } catch (error) {
    console.error("Error adding position:", error);
  }
}

// To-Do: Convert amounts into numbers
export async function addActivePositionInDynamo(
  userId: string,
  poolAddress: string,
  token0Address: string,
  token1Address: string,
  token0LiquidityAmount: string,
  token1LiquidityAmount: string,
  tokenId: string,
): Promise<void> {
  const token0LiquidityAmountNumber = parseFloat(token0LiquidityAmount);
  const token1LiquidityAmountNumber = parseFloat(token1LiquidityAmount);

  const lowercaseToken0Address = token0Address.toLowerCase();
  const lowercaseToken1Address = token1Address.toLowerCase();

  const network = "zksync";
  const addresses = [token0Address, token1Address];

  try {
    const prices = await getTokenPrices(addresses);

    const token0InitialPrice = parseFloat(prices[lowercaseToken0Address]);
    const token1InitialPrice = parseFloat(prices[lowercaseToken1Address]);

    console.log("TOKEN 0 PRICE:", token0InitialPrice);
    console.log("TOKEN 1 PRICE:", token1InitialPrice);

    const position: Position = {
      userId,
      poolAddress,
      token0Address,
      token1Address,
      token0LiquidityAmount: token0LiquidityAmountNumber,
      token1LiquidityAmount: token1LiquidityAmountNumber,
      tokenId,
      token0InitialPrice,
      token1InitialPrice,
    };

    await putPosition(position);
  } catch (error) {
    console.error("Error creating position entry:", error);
  }
}

/**
 * Main function to add active positions in supabase
 */
export async function addActivePositionInSupabase(
  userId: string,
  tokenId: string,
  poolAddress: string,
): Promise<void> {
  console.log(
    "Currently adding position to user's positions array in supabase:",
    tokenId,
    poolAddress,
  );

  try {
    console.log("Inside try block...");
    console.log("USER ID IN PROGRESS:", userId);

    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("positions")
      .eq("id", userId);

    console.log("USER DATA:", userData);

    if (fetchError) throw fetchError;

    // Check if user exists
    if (!userData || userData.length === 0) {
      throw new Error(`No user found with ID ${userId}`);
    }

    console.log("Creating new position object rn...");

    const userPositions = userData[0]?.positions || [];

    // Create the new position object
    const newPosition = {
      token_id: tokenId,
      pool_address: poolAddress,
    };

    // Append the new position to the array
    const updatedPositions = [...userPositions, newPosition];

    // Update the user's positions array
    const { data, error } = await supabase
      .from("users")
      .update({ positions: updatedPositions })
      .eq("id", userId)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error(`Failed to update user with ID ${userId}`);
    }

    console.log("Successfully added position to user's positions array");
  } catch (error) {
    console.error("Error adding active position in Supabase:", error);
    throw error;
  }
}

/**
 * Main + helper functions to evaluate whether a position can be removed
 */

export async function getPositionsByUserId(userId: string): Promise<Position[]> {
  const params = {
    TableName: "positions",
    KeyConditionExpression: "#userId = :userId",
    ExpressionAttributeNames: {
      "#userId": "userId", // Attribute name for partition key
    },
    ExpressionAttributeValues: {
      ":userId": userId, // Value for the partition key
    },
  };

  try {
    const command = new QueryCommand(params);
    const response = await docClient.send(command);

    console.log("Query Results:", response.Items);

    return (response.Items as Position[]) || [];
  } catch (error) {
    console.error("Error fetching positions for user:", error);
    throw error;
  }
}

async function compareAssetPrices(
  userId: string,
  tokenId: string,
): Promise<{
  token0PriceDifference: number;
  token1PriceDifference: number;
} | null> {
  try {
    // Step 1: Fetch positions for the given user
    const positions = await getPositionsByUserId(userId);

    // Step 2: Find the position with the matching tokenId
    const position = positions.find(pos => pos.tokenId === tokenId);

    if (!position) {
      console.log(`No position found with tokenId: ${tokenId}`);
      return null;
    }

    // Step 3: Extract relevant data from the position
    const { token0Address, token1Address, token0InitialPrice, token1InitialPrice } = position;

    // Step 4: Get current token prices
    const prices = await getTokenPrices([token0Address, token1Address]);

    const currentToken0Price = parseFloat(prices[token0Address.toLowerCase()]);
    const currentToken1Price = parseFloat(prices[token1Address.toLowerCase()]);

    // Step 5: Calculate percent difference for token0
    const token0PriceDifference = (currentToken0Price - token0InitialPrice) / token0InitialPrice;

    // Step 6: Calculate percent difference for token1
    const token1PriceDifference = (currentToken1Price - token1InitialPrice) / token1InitialPrice;

    const result = {
      token0PriceDifference,
      token1PriceDifference,
    };

    return result;
  } catch (error) {
    console.error("Error comparing asset prices:", error);
    throw error;
  }
}

export async function getPositionRemovalStatus(userId: string, tokenId: string): Promise<boolean> {
  const priceDifferences = await compareAssetPrices(userId, tokenId);
  if (!priceDifferences) {
    return false;
  }

  const token0PriceDifference = priceDifferences.token0PriceDifference || 0;
  const token1PriceDifference = priceDifferences.token1PriceDifference || 0;

  // To-Do: 10% difference hardcoded for now but need to gauge this from risk profile later
  if (token0PriceDifference > 0.1 || token1PriceDifference > 0.1) {
    console.log("Position cannot be removed yet");
    return false;
  }

  return true;
}
