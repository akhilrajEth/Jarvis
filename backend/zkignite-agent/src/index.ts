INDEX.ts: import {
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
import { pancakeSwapActionProvider } from "./action-providers/pancakeswap/pancakeSwapActionProvider";
import { syncSwapActionProvider } from "./action-providers/syncswap/syncSwapActionProvider";
import { allocationCalculatorActionProvider } from "./action-providers/allocation/allocationCalculatorActionProvider";
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
  const requiredVars = [
    "OPENAI_API_KEY",
    "CDP_API_KEY_NAME",
    "CDP_API_KEY_PRIVATE_KEY",
  ];
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Exit if any required variables are missing
  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach((varName) => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }
}

validateEnvironment();

/**
 * Initialize the agent with CDP Agentkit
 *
 * @returns Agent executor and config
 */
async function initializeAgent(userId: string, walletId: string) {
  try {
    const llm = new ChatOpenAI({
      apiKey: process.env.GAIA_API_KEY,
      configuration: {
        baseURL: "https://llama70b.gaia.domains/v1",
      },
    });

    const account = privateKeyToAccount(
      (process.env.PRIVATE_KEY || "0x1234") as `0x${string}`
    );

    const config: PrivyWalletConfig = {
      appId: process.env.PRIVY_APP_ID!,
      appSecret: process.env.PRIVY_APP_SECRET!,
      chainId: "324", // Note: Defaults to 84532 (base-sepolia)
      walletId: walletId,
    };

    const walletProvider = await PrivyWalletProvider.configureWithWallet(
      config
    );

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
        pancakeSwapActionProvider(),
        syncSwapActionProvider(),
        allocationCalculatorActionProvider(),
        cdpApiActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n"
          ),
        }),
        cdpWalletActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n"
          ),
        }),
      ],
    });

    const tools = await getLangChainTools(agentkit);

    // Store buffered conversation history in memory
    const memory = new MemorySaver();
    const agentConfig = {
      configurable: { thread_id: "CDP AgentKit Chatbot Example!" },
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
        "1. Request to view LP position opportunities for Pancakeswap and Syncswap\n" +
        "2. Identify one LP pool with the highest APR across both Pancakeswap and Syncswap pools\n" +
        "3. A pool only has two tokens, so retrieve token0 and token1 addresses from the pool with the highest APR\n" +
        "4. Then, check if you have those both required tokens by verifying balances using their addresses\n" +
        "4. The balances you see are in wei so to convert to whole units use the weiToEthConverter tool\n" +
        "5. Before creating an LP position, use the allocation tool to calculate the max percentage to allocate to the balance of each token for the amount0Desired and amount1Desired, which should be in units of eth\n" +
        "6. Execute LP position creation on appropriate DEX with optimal token amounts based the chosen amount0Desired and amount1Desired in units of eth (but don't use the entire balance).\n" +
        `Whenever you need to call a function that requires a userId to read or write to or from the database, use the userId variable, which is ${userId}.\n` +
        "Once you create an LP position, don't do anything else unless there is a new LP opportunity with a higher APR than the pool your just made a position for.",
    });

    return { agent, config: agentConfig };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

/**
 * Run the agent interactively based on user input
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runChatMode(agent: any, config: any) {
  console.log("Starting chat mode... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const userInput = await question("\nPrompt: ");

      if (userInput.toLowerCase() === "exit") {
        break;
      }

      const stream = await agent.stream(
        { messages: [new HumanMessage(userInput)] },
        config
      );

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
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
async function runAutonomousMode(
  agent: any,
  config: any,
  userId: string,
  maxRuntime = 24
) {
  console.log("Starting autonomous mode...");
  const startTime = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (Date.now() - startTime < maxRuntime * 1000) {
    try {
      const thought =
        "You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. " +
        "You are empowered to interact onchain using your tools. Your wallet is on ZKSync (chainId: 324) " +
        "and you will have some initial wallet balance. " +
        "1. Request to view LP position opportunities for Pancakeswap and Syncswap\n" +
        "2. Identify one LP pool with the highest APR across both Pancakeswap and Syncswap pools\n" +
        "3. A pool only has two tokens, so retrieve token0 and token1 addresses from the pool with the highest APR\n" +
        "4. Then, check if you have those both required tokens by verifying balances using their addresses\n" +
        "4. The balances you see are in wei so to convert to whole units use the weiToEthConverter tool\n" +
        "5. Before creating an LP position, use the allocation tool to calculate the max percentage to allocate to the balance of each token for the amount0Desired and amount1Desired, which should be in units of eth\n" +
        "6. Execute LP position creation on appropriate DEX with optimal token amounts based the chosen amount0Desired and amount1Desired in units of eth (but don't use the entire balance).\n" +
        `Whenever you need to call a function that requires a userId to read or write to or from the database, use the userId variable, which is ${userId}.\n` +
        "Once you create an LP position, don't do anything else unless there is a new LP opportunity with a higher APR than the pool your just made a position for.";
      const stream = await agent.stream(
        { messages: [new HumanMessage(thought)] },
        config
      );

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
 * Choose whether to run in autonomous or chat mode based on user input
 *
 * @returns Selected mode
 */
async function chooseMode(): Promise<"chat" | "auto"> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.log("\nAvailable modes:");
    console.log("1. chat    - Interactive chat mode");
    console.log("2. auto    - Autonomous action mode");

    const choice = (await question("\nChoose a mode (enter number or name): "))
      .toLowerCase()
      .trim();

    if (choice === "1" || choice === "chat") {
      rl.close();
      return "chat";
    } else if (choice === "2" || choice === "auto") {
      rl.close();
      return "auto";
    }
    console.log("Invalid choice. Please try again.");
  }
}

/**
 * Start the chatbot agent
 */
async function main() {
  try {
    const walletIdMap = await getWalletIdsForUsers();
    console.log("WALLET ID MAP:", walletIdMap);
    const userIds = Object.keys(walletIdMap);

    for (const userId of userIds) {
      const walletId = walletIdMap[userId];
      const { agent, config } = await initializeAgent(userId, walletId);
      await runAutonomousMode(agent, config, userId);
    }

    console.log("Completed running agent for all users.");

    // const { agent, config } = await initializeAgent();
    // const mode = await chooseMode();

    // if (mode === "chat") {
    //   await runChatMode(agent, config);
    // } else {
    //   await runAutonomousMode(agent, config);
    // }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  console.log("Starting Agent...");
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}