import {
  AgentKit,
  walletActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  PrivyWalletProvider,
  PrivyWalletConfig,
} from "@coinbase/agentkit";
import { privateKeyToAccount } from "viem/accounts";
import { swapActionProvider } from "./action-providers/swap/swapActionProvider";
import { erc20ActionProvider } from "./action-providers/erc20/erc20ActionProvider";
import { wethActionProvider } from "./action-providers/weth/wethActionProvider";
import { opportunitiesActionProvider } from "./action-providers/opportunityDatabase/opportunityDatabaseActionProvider";
import { weiToEthConverterActionProvider } from "./action-providers/weiToEthConverter/weiToEthConverterActionProvider";
import { uniswapActionProvider } from "./action-providers/uniswap/uniswapActionProvider";
import { userPositionsActionProvider } from "./action-providers/userPositions/userPositionsActionProvider";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { getWalletIdsForUsers } from "./utils";
import * as fs from "fs";
import * as readline from "readline";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Validates that required environment variables are set
 *
 * @throws {Error} - If required environment variables are missing
 * @returns {void}
 */
function validateEnvironment(): void {
  const missingVars: string[] = [];

  // Check required variables
  const requiredVars = ["OPENAI_API_KEY", "CDP_API_KEY_NAME", "CDP_API_KEY_PRIVATE_KEY"];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Exit if any required variables are missing
  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach(varName => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }
}

/**
 * Initialize the agent with CDP Agentkit
 *
 * @returns Agent executor and config
 */
async function initializeAgent(userId: string, walletId: string) {
  try {
    // const llm = new ChatOpenAI({
    //   apiKey: process.env.GAIA_API_KEY,
    //   configuration: {
    //     baseURL: "https://llama70b.gaia.domains/v1",
    //   },
    // });

    // const account = privateKeyToAccount((process.env.PRIVATE_KEY || "0x1234") as `0x${string}`);

    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
    });

    const config: PrivyWalletConfig = {
      appId: process.env.PRIVY_APP_ID ?? "",
      appSecret: process.env.PRIVY_APP_SECRET ?? "",
      chainId: "324", // Note: Defaults to 84532 (base-sepolia)
      walletId: walletId,
    };

    const walletProvider = await PrivyWalletProvider.configureWithWallet(config);

    // Initialize AgentKit
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        swapActionProvider(),
        erc20ActionProvider(),
        opportunitiesActionProvider(),
        wethActionProvider(),
        walletActionProvider(),
        weiToEthConverterActionProvider(),
        uniswapActionProvider(),
        userPositionsActionProvider(),
        cdpApiActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
        cdpWalletActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      ],
    });

    const tools = await getLangChainTools(agentkit);

    // Store buffered conversation history in memory
    const memory = new MemorySaver();
    const agentConfig = {
      configurable: { thread_id: `Autonomous Yield Farming Agent For User ${userId}` },
    };

    // Create React Agent using the LLM and CDP AgentKit tools
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier:
        "You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. " +
        "You are empowered to interact onchain using your tools. Your wallet is on ZKSync (chainId: 324) " +
        "and you will have some initial wallet balance. " +
        `1. Check if the user has any active positions using the userPositionsActionProvider. The userId ${userId} should be passed as a parameter.\n` +
        "2. If the user does not have any active positions, proceed with the steps to create a new position:\n" +
        "   - Request to view LP position opportunities for Pancakeswap and Syncswap\n" +
        "   - Compare APRs across all available pools from Pancakeswap and Syncswap, and identify the LP pool with the highest APR\n" +
        "   - Retrieve the addresses of token0 and token1 from the pool with the highest APR (each pool contains exactly two tokens)\n" +
        "   - Verify your wallet balances for token0 and token1 using their respective addresses\n" +
        "   - Convert balances from wei to ETH units using the weiToEthConverter tool\n" +
        "   - If you lack sufficient amounts of token0 or token1, use the swap tool to acquire them:\n" +
        "     - Call the swap tool once to swap for token0\n" +
        "     - Call the swap tool again to swap for token1\n" +
        "   - Execute LP position creation on the appropriate DEX using optimal token amounts based on amount0Desired and amount1Desired in ETH units (ensure you do not use your entire wallet balance)\n" +
        "3. If the user does have an active position, check if the poolAddress of that position matches the pool with the highest APR:\n" +
        "   - If it matches, do nothing.\n" +
        "   - If it does not match, call either the Syncswap or Pancakeswap tool to invoke the removeLiquidity function.\n" +
        "   - Then follow all steps from part two to create a new position for the pool with the highest APR.\n" +
        `Whenever you need to call a function that requires a userId to read or write to or from the database, use the userId variable, which is ${userId}.\n` +
        "After creating an LP position, remain idle unless a new LP opportunity arises with a higher APR than your current pool.",
    });

    return { agent, config: agentConfig };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

/**
 * Run the agent autonomously with specified intervals
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 * @param maxRuntime - Time limit for agent to complete its tasks
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runAutonomousMode(agent: any, config: any, userId: string, maxRuntime = 24) {
  console.log("Starting autonomous mode...");
  const startTime = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (Date.now() - startTime < maxRuntime * 1000) {
    try {
      const thought =
        "You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. " +
        "You are empowered to interact onchain using your tools. Your wallet is on ZKSync (chainId: 324) " +
        "and you will have some initial wallet balance. " +
        `1. Check if the user has any active positions using the userPositionsActionProvider. The userId ${userId} should be passed as a parameter.\n` +
        "2. If the user does not have any active positions, proceed with the steps to create a new position:\n" +
        "   - Request to view LP position opportunities for Pancakeswap and Syncswap\n" +
        "   - Compare APRs across all available pools from Pancakeswap and Syncswap, and identify the LP pool with the highest APR\n" +
        "   - Retrieve the addresses of token0 and token1 from the pool with the highest APR (each pool contains exactly two tokens)\n" +
        "   - Verify your wallet balances for token0 and token1 using their respective addresses\n" +
        "   - Convert balances from wei to ETH units using the weiToEthConverter tool\n" +
        "   - If you lack sufficient amounts of token0 or token1, use the swap tool to acquire them:\n" +
        "     - Call the swap tool once to swap for token0\n" +
        "     - Call the swap tool again to swap for token1\n" +
        "   - Execute LP position creation on the appropriate DEX using optimal token amounts based on amount0Desired and amount1Desired in ETH units (ensure you do not use your entire wallet balance)\n" +
        "3. If the user does have an active position, check if the poolAddress of that position matches the pool with the highest APR:\n" +
        "   - If it matches, do nothing.\n" +
        "   - If it does not match, call either the Syncswap or Pancakeswap tool to invoke the removeLiquidity function.\n" +
        "   - Then follow all steps from part two to create a new position for the pool with the highest APR.\n" +
        `Whenever you need to call a function that requires a userId to read or write to or from the database, use the userId variable, which is ${userId}.\n` +
        "After creating an LP position, remain idle unless a new LP opportunity arises with a higher APR than your current pool.";

      const stream = await agent.stream({ messages: [new HumanMessage(thought)] }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }

      if (Date.now() - startTime > (maxRuntime - 5) * 1000) {
        console.log("Approaching max runtime, ending execution.");
        break;
      }
      console.log(`Autonomous mode completed for user: ${userId}.`);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
      process.exit(1);
    }
  }
}

/**
 * Start the chatbot agent
 */
export async function handler(event: any): Promise<any> {
  try {
    validateEnvironment();
    const walletIdMap = await getWalletIdsForUsers();
    console.log("WALLET ID MAP:", walletIdMap);
    const userIds = Object.keys(walletIdMap);

    for (const userId of userIds) {
      const walletId = walletIdMap[userId];
      const { agent, config } = await initializeAgent(userId, walletId);

      console.log(`Running agent for user ID ${userId}`);

      await runAutonomousMode(agent, config, userId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Agent execution completed successfully." }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
}
