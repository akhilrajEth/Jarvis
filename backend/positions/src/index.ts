import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

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
  timestamp: string;
}

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

async function createPositionEntry() {
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

    const timestamp = new Date().toISOString();

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
      timestamp,
    };

    await putPosition(position);
  } catch (error) {
    console.error("Error creating position entry:", error);
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
  userId: string
): Promise<{ token0PriceDifference: number; token1PriceDifference: number }[]> {
  try {
    // Step 1: Fetch positions for the given user
    const positions = await getPositionsByUserId();

    // Step 2: Iterate through each position and calculate price differences
    const priceDifferences = await Promise.all(
      positions.map(async (position) => {
        const {
          token0Address,
          token1Address,
          token0InitialPrice,
          token1InitialPrice,
        } = position;

        // Step 3: Get current token prices
        const prices = await getTokenPrices("zksync", [
          token0Address,
          token1Address,
        ]);

        const currentToken0Price = parseFloat(
          prices[token0Address.toLowerCase()]
        );
        const currentToken1Price = parseFloat(
          prices[token1Address.toLowerCase()]
        );

        // Step 4: Calculate percent difference for token0
        const token0PriceDifference =
          (currentToken0Price - token0InitialPrice) / token0InitialPrice;

        // Step 5: Calculate percent difference for token1
        const token1PriceDifference =
          (currentToken1Price - token1InitialPrice) / token1InitialPrice;

        return {
          token0PriceDifference,
          token1PriceDifference,
        };
      })
    );

    console.log("Price Differences:", priceDifferences);
    return priceDifferences;
  } catch (error) {
    console.error("Error comparing asset prices:", error);
    throw error;
  }
}

async function main() {
  try {
    // console.log("Creating a position entry...");
    // await createPositionEntry();

    // console.log("Fetching positions for user...");
    // await getPositionsByUserId();

    console.log("Comparing asset prices...");
    const userId = "632bbb2f-14ba-444d-8c41-ab09115005f0";
    await compareAssetPrices(userId);
  } catch (error) {
    console.error("Failed to create position entry:", error);
  }
}

main();
