import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
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

async function main() {
  console.log("Creating a position entry...");

  try {
    await createPositionEntry();
  } catch (error) {
    console.error("Failed to create position entry:", error);
  }
}

main();
