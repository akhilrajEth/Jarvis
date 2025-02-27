import {
  AgentKit,
  CdpWalletProvider,
  walletActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  ViemWalletProvider,
} from "@coinbase/agentkit";

import { privateKeyToAccount } from "viem/accounts";
import { holesky } from "viem/chains";
import { http } from "viem";
import { createWalletClient } from "viem";

import { stakeActionProvider } from "./action-providers/stake/stakeActionProvider";
import { restakeActionProvider } from "./action-providers/restake/restakeActionProvider";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as fs from "fs";
import * as readline from "readline";
import * as dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";

dotenv.config();
const app = express();
const port = 3001;

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

validateEnvironment();

/**
 * Initialize the agent with CDP Agentkit
 *
 * @returns Agent executor and config
 */
async function initializeAgent() {
  try {
    // Initialize LLM
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
    });

    const account = privateKeyToAccount((process.env.PRIVATE_KEY || "0x1234") as `0x${string}`);

    const client = createWalletClient({
      account,
      chain: holesky,
      transport: http(),
    });

    const walletProvider = new ViemWalletProvider(client);

    // Initialize AgentKit
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        stakeActionProvider(),
        restakeActionProvider(),
        walletActionProvider(),
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
      configurable: { thread_id: "CDP AgentKit Chatbot Example!" },
    };

    // Create React Agent using the LLM and CDP AgentKit tools
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier:
        "You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit." +
        "When you are run, stake ETH by calling the eth staking tool. Do not call the restake tool.",
    });

    return { agent, config: agentConfig };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Run the agent autonomously with specified intervals
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 * @param interval - Time interval between actions in seconds
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runAutonomousMode(agent: any, config: any, interval = 10) {
  console.log("Starting autonomous mode...");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const thought =
        "You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit." +
        "When you are run, stake ETH by calling the eth staking tool. Do not call the restake tool.";
      const stream = await agent.stream({ messages: [new HumanMessage(thought)] }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }

      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
      process.exit(1);
    }
  }
}

/**
 * Run the agent interactively based on user input
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// async function runChatMode(agent: any, config: any) {
//   console.log("Starting chat mode... Type 'exit' to end.");

//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });

//   const question = (prompt: string): Promise<string> =>
//     new Promise(resolve => rl.question(prompt, resolve));

//   try {
//     // eslint-disable-next-line no-constant-condition
//     while (true) {
//       const userInput = await question("\nPrompt: ");

//       if (userInput.toLowerCase() === "exit") {
//         break;
//       }

//       const stream = await agent.stream({ messages: [new HumanMessage(userInput)] }, config);

//       for await (const chunk of stream) {
//         if ("agent" in chunk) {
//           console.log(chunk.agent.messages[0].content);
//         } else if ("tools" in chunk) {
//           console.log(chunk.tools.messages[0].content);
//         }
//         console.log("-------------------");
//       }
//     }
//   } catch (error) {
//     if (error instanceof Error) {
//       console.error("Error:", error.message);
//     }
//     process.exit(1);
//   } finally {
//     rl.close();
//   }
// }

/**
 * Choose whether to run in autonomous or chat mode based on user input
 *
 * @returns Selected mode
 */
// async function chooseMode(): Promise<"chat" | "auto"> {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });

//   const question = (prompt: string): Promise<string> =>
//     new Promise(resolve => rl.question(prompt, resolve));

//   // eslint-disable-next-line no-constant-condition
//   while (true) {
//     console.log("\nAvailable modes:");
//     console.log("1. chat    - Interactive chat mode");
//     console.log("2. auto    - Autonomous action mode");

//     const choice = (await question("\nChoose a mode (enter number or name): "))
//       .toLowerCase()
//       .trim();

//     if (choice === "1" || choice === "chat") {
//       rl.close();
//       return "chat";
//     } else if (choice === "2" || choice === "auto") {
//       rl.close();
//       return "auto";
//     }
//     console.log("Invalid choice. Please try again.");
//   }
// }

/**
 * Start the chatbot agent
 */
async function main() {
  try {
    const { agent, config } = await initializeAgent();
    // const mode = await chooseMode();

    // if (mode === "chat") {
    //   await runChatMode(agent, config);
    // } else {
    //   await runAutonomousMode(agent, config);
    // }
    await runAutonomousMode(agent, config);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));

app.options("/run-agent", cors(corsOptions));

app.get("/run-agent", async (req: Request, res: Response) => {
  try {
    console.log("Starting Agent...");
    res.setHeader("Content-Type", "text/plain");
    res.send("Agent started successfully");
    await main();
  } catch (error) {
    console.error("Fatal error:", error);
    res.status(500).send("Error starting agent");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
