import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Initializing db clients
 */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const client = new DynamoDBClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

/**
 * Constants and types
 */

// To-Do: Move this to a separate file when converting this into a cdp agentkit tool
const BASE_URL = "https://api.geckoterminal.com/api/v2";
type TokenPricesResponse = Record<string, string>;

interface Position {
  userId: string;
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
 * DynamoDB helper and main functions
 */

async function getTokenPrices(
  network: string,
  addresses: string[]
): Promise<TokenPricesResponse> {
  try {
    const endpoint = `/simple/networks/${network}/token_price/${addresses.join(
      ","
    )}`;
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

async function addActivePositionInDynamo() {
  // To-Do: When converting this into a cdp agentkit tool, these will be parameters
  const userId = "632bbb2f-14ba-444d-8c41-ab09115005f0";
  const token0Address = "0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91";
  const token1Address = "0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E";
  const lowercaseToken0Address = token0Address.toLowerCase();
  const lowercaseToken1Address = token1Address.toLowerCase();

  const network = "zksync";
  const addresses = [token0Address, token1Address];

  // To-Do: Hard coded values for now but will be parameters
  const token0LiquidityAmount = 1000;
  const token1LiquidityAmount = 1000;
  const tokenId = "12345";

  try {
    const prices = await getTokenPrices(network, addresses);

    const token0InitialPrice = parseFloat(prices[lowercaseToken0Address]);
    const token1InitialPrice = parseFloat(prices[lowercaseToken1Address]);

    console.log("TOKEN 0 PRICE:", token0InitialPrice);
    console.log("TOKEN 1 PRICE:", token1InitialPrice);
    const position: Position = {
      userId,
      token0Address,
      token1Address,
      token0LiquidityAmount,
      token1LiquidityAmount,
      tokenId,
      token0InitialPrice,
      token1InitialPrice,
    };

    await putPosition(position);
  } catch (error) {
    console.error("Error creating position entry:", error);
  }
}

async function deleteActivePositionInDynamo(
  tokenId: string,
  userId: string
): Promise<void> {
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
  } catch (error) {
    console.error("Error deleting position:", error);
    throw error;
  }
}

async function getPositionsByUserId(): Promise<Position[]> {
  // To-Do: When converting this into a cdp agentkit tool, this will be a parameter
  const userId = "632bbb2f-14ba-444d-8c41-ab09115005f0";
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

    // Cast response.Items to Position[] or return an empty array if no items are found
    return (response.Items as Position[]) || [];
  } catch (error) {
    console.error("Error fetching positions for user:", error);
    throw error;
  }
}

async function compareAssetPrices(
  userId: string,
  tokenId: string
): Promise<{
  token0PriceDifference: number;
  token1PriceDifference: number;
} | null> {
  try {
    // Step 1: Fetch positions for the given user
    const positions = await getPositionsByUserId();

    // Step 2: Find the position with the matching tokenId
    const position = positions.find((pos) => pos.tokenId === tokenId);

    if (!position) {
      console.log(`No position found with tokenId: ${tokenId}`);
      return null;
    }

    // Step 3: Extract relevant data from the position
    const {
      token0Address,
      token1Address,
      token0InitialPrice,
      token1InitialPrice,
    } = position;

    // Step 4: Get current token prices
    const prices = await getTokenPrices("zksync", [
      token0Address,
      token1Address,
    ]);

    const currentToken0Price = parseFloat(prices[token0Address.toLowerCase()]);
    const currentToken1Price = parseFloat(prices[token1Address.toLowerCase()]);

    // Step 5: Calculate percent difference for token0
    const token0PriceDifference =
      (currentToken0Price - token0InitialPrice) / token0InitialPrice;

    // Step 6: Calculate percent difference for token1
    const token1PriceDifference =
      (currentToken1Price - token1InitialPrice) / token1InitialPrice;

    const result = {
      token0PriceDifference,
      token1PriceDifference,
    };

    console.log("Price Differences:", result);
    return result;
  } catch (error) {
    console.error("Error comparing asset prices:", error);
    throw error;
  }
}

async function getPositionRemovalStatus(
  userId: string,
  tokenId: string
): Promise<boolean> {
  // To-Do: Implement this function
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

/**
 * Supabase DB helper and main functions
 */

async function addActivePositionInSupabase(
  userId: string,
  tokenId: string,
  poolAddress: string
) {
  console.log(
    "Currently adding position to user's positions array in supabase:",
    tokenId,
    poolAddress
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

async function removeActivePositionFromSupabase(
  userId: string,
  tokenId: string
) {
  console.log(
    "Currently removing position from user's positions array in supabase:",
    tokenId,
    poolAddress
  );

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
      (position: SupabasePosition) => !(position.token_id === tokenId)
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
  } catch (error) {
    console.error("Error removing active position in Supabase:", error);
    throw error;
  }
}

/**
 * Combined functions that perform actions in both DBs
 */

// To-Do: Use this in the main agent tool file and export all other helper and main funcs from above to a utils file
async function addActivePosition(
  userId: string,
  tokenId: string,
  poolAddress: string
) {
  await addActivePositionInSupabase(userId, tokenId, poolAddress);
  await addActivePositionInDynamo();
}

async function removeActivePosition(userId: string, tokenId: string) {
  await removeActivePositionFromSupabase(userId, tokenId);
  await addActivePositionInDynamo();
}

async function main() {
  try {
    // console.log("Creating a position entry...");
    // await addActivePositionInDynamo();
    // console.log("Fetching positions for user...");
    // await getPositionsByUserId();
    // console.log("Getting position removal status...");
    // const userId = "632bbb2f-14ba-444d-8c41-ab09115005f0";
    // const tokenId = "1234";
    // const status = await getPositionRemovalStatus(userId, tokenId);
    // console.log("STATUS:", status);
    // console.log("Adding active position...");
    // const userId = "632bbb2f-14ba-444d-8c41-ab09115005f0";
    // const tokenId = "12345";
    // const poolAddress = "0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91";
    // await addActivePosition(userId, tokenId, poolAddress);
    // await removeActivePositionFromSupabase(userId, tokenId, poolAddress);
    // await deleteActivePositionInDynamo(tokenId, userId);
  } catch (error) {
    console.error("Failed to create position entry:", error);
  }
}

main();
