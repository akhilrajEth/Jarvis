import { z } from "zod";
import { GetBalanceSchema, TransferSchema } from "./schemas";
import { abi } from "./constants";
import { encodeFunctionData, Hex } from "viem";

import { ActionProvider, EvmWalletProvider, Network, CreateAction } from "@coinbase/agentkit";

/**
 * ERC20ActionProvider is an action provider for ERC20 tokens.
 */
export class ERC20ActionProvider extends ActionProvider<EvmWalletProvider> {
  /**
   * Constructor for the ERC20ActionProvider.
   */
  constructor() {
    super("erc20", []);
  }

  /**
   * Gets the balance of an ERC20 token.
   *
   * @param walletProvider - The wallet provider to get the balance from.
   * @param args - The input arguments for the action.
   * @returns A message containing the balance.
   */
  @CreateAction({
    name: "get_balance",
    description: `
    This tool will get the balance of an ERC20 asset in the wallet in WEI. It takes the contract address as input.
    `,
    schema: GetBalanceSchema,
  })
  async getBalance(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof GetBalanceSchema>,
  ): Promise<string> {
    console.log("Currently checking balances of the following token: ", args.contractAddress);
    try {
      const balance = await walletProvider.readContract({
        address: args.contractAddress as Hex,
        abi,
        functionName: "balanceOf",
        args: [`0x${walletProvider.getAddress()}`],
      });

      console.log(`Balance of ${args.contractAddress} is ${balance}`);
      return `Balance of ${args.contractAddress} is ${balance}`;
    } catch (error) {
      return `Error getting balance: ${error}`;
    }
  }

  /**
   * Transfers a specified amount of an ERC20 token to a destination onchain.
   *
   * @param walletProvider - The wallet provider to transfer the asset from.
   * @param args - The input arguments for the action.
   * @returns A message containing the transfer details.
   */
  @CreateAction({
    name: "transfer",
    description: `
    This tool will transfer an ERC20 token from the wallet to another onchain address.

It takes the following inputs:
- amount: The amount to transfer
- contractAddress: The contract address of the token to transfer
- destination: Where to send the funds (can be an onchain address, ENS 'example.eth', or Basename 'example.base.eth')

Important notes:
- Ensure sufficient balance of the input asset before transferring
- When sending native assets (e.g. 'eth' on base-mainnet), ensure there is sufficient balance for the transfer itself AND the gas cost of this transfer
    `,
    schema: TransferSchema,
  })
  async transfer(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof TransferSchema>,
  ): Promise<string> {
    try {
      const hash = await walletProvider.sendTransaction({
        to: args.contractAddress as Hex,
        data: encodeFunctionData({
          abi,
          functionName: "transfer",
          args: [args.destination as Hex, BigInt(args.amount)],
        }),
      });

      await walletProvider.waitForTransactionReceipt(hash);

      console.log(
        `Transferred ${args.amount} of ${args.contractAddress} to ${args.destination}.\nTransaction hash for the transfer: ${hash}`,
      );
      return `Transferred ${args.amount} of ${args.contractAddress} to ${args.destination}.\nTransaction hash for the transfer: ${hash}`;
    } catch (error) {
      return `Error transferring the asset: ${error}`;
    }
  }

  supportsNetwork = (network: Network) => true;
}

export const erc20ActionProvider = () => new ERC20ActionProvider();
