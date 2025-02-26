import { ActionProvider, EvmWalletProvider, Network, CreateAction } from "@coinbase/agentkit";
import { z } from "zod";
import { StakeSchema } from "./schemas";
import { v4 as uuidv4 } from "uuid";
import axios, { AxiosResponse } from "axios";
import { supabase } from "../supabaseClient";
import { signAndBroadcast } from "../utils";

export class StakeActionProvider extends ActionProvider {
  constructor() {
    super("stake", []);
  }

  private apiBaseUrl = "https://api-test-holesky.p2p.org/api/v1/";
  private authToken = "Bearer scwaeTkXzol07FHmCSzJSMAc9v64qAVp";

  @CreateAction({
    name: "stake",
    description: "Uses P2P API to stake 32 ETH",
    schema: StakeSchema,
  })
  async executeStaking(wallet: EvmWalletProvider) {
    try {
      // Step 1: Create EigenPod
      console.log("Step 1: Creating EigenPod...");
      const podResponse = await this.createEigenPod();
      console.log("Pod Created:", podResponse.serializeTx);

      // Sign and Broadcast EigenPod Transaction
      console.log("Signing and broadcasting EigenPod transaction...");
      const signedPodTx = await signAndBroadcast(wallet, {
        txHex: podResponse.serializeTx,
        gasLimit: podResponse.gasLimit,
        maxFeeGas: podResponse.maxFeePerGas,
        maxPriorityFeeGas: podResponse.maxPriorityFeePerGas,
        amount: podResponse.value,
      });

      console.log(signedPodTx);

      // Step 2: Create Restake Request
      console.log("Step 2: Creating Restake Request...");
      const { uuid, result: restakeRequest } = await this.createRestakeRequest(wallet.address);

      // Step 3: Check Restake Status with retry
      console.log("Step 3: Checking Restake Status...");
      const restakeStatus = await this.getRestakeStatusWithRetry(uuid);

      // Step 4: Create Deposit Transaction
      console.log("Step 4: Creating Deposit Transaction...");
      const depositTxResponse = await this.createDepositTx(restakeStatus);

      // Step 5: Wait for transaction finality
      console.log("Step 5: Wait 30 seconds for the first transaction to complete...");
      await wait(30000);

      // Step 6: Execute Deposit
      console.log("Step 6: Signing & Broadcasting Deposit Transaction...");

      const signedDepositTx = await signAndBroadcast(wallet, {
        txHex: depositTxResponse.serializeTx,
        gasLimit: depositTxResponse.gasLimit,
        maxFeeGas: depositTxResponse.maxFeePerGas,
        maxPriorityFeeGas: depositTxResponse.maxPriorityFeePerGas,
        amount: depositTxResponse.value,
      });

      console.log(signedDepositTx);
      this.addEthRestaked(depositTxResponse.value);

      console.log(
        `\n🔍 View your validator on BeaconChain: https://holesky.beaconcha.in/validator/${pubkey}`,
      );
    } catch (error) {
      console.error(
        "Staking process failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private getAuthorizationHeaders(): Record<string, string> {
    return {
      accept: "application/json",
      authorization: this.authToken,
      "content-type": "application/json",
    };
  }

  private async createEigenPod(): Promise<any> {
    const url = `${this.apiBaseUrl}eth/staking/eigenlayer/tx/create-pod`;
    try {
      const response: AxiosResponse<{ result: any }> = await axios.post(
        url,
        {},
        { headers: this.getAuthorizationHeaders() },
      );
      console.log("EigenPod Creation Response:", response.data);
      return response.data.result;
    } catch (error) {
      console.error(
        "Error creating EigenPod:",
        error instanceof Error ? error.message : "Unknown error",
      );
      throw error;
    }
  }

  private async createRestakeRequest(stakerAddress: string): Promise<{
    uuid: string;
    result: any;
  }> {
    const uuid = uuidv4();
    const url = `${this.apiBaseUrl}eth/staking/direct/nodes-request/create`;
    const data = {
      id: uuid,
      type: "RESTAKING",
      validatorsCount: 1,
      eigenPodOwnerAddress: stakerAddress,
      feeRecipientAddress: stakerAddress,
      controllerAddress: stakerAddress,
      nodesOptions: { location: "any", relaysSet: null },
    };

    try {
      const response: AxiosResponse<{ result: any }> = await axios.post(url, data, {
        headers: this.getAuthorizationHeaders(),
      });
      console.log("Restake Request Response:", response.data);
      return { uuid, result: response.data.result };
    } catch (error) {
      console.error(
        "Error initiating restake request:",
        error instanceof Error ? error.message : "Unknown error",
      );
      throw error;
    }
  }

  private async getRestakeStatusWithRetry(
    uuid: string,
    retries: number = 3,
    delay: number = 3000,
  ): Promise<any> {
    const url = `${this.apiBaseUrl}eth/staking/direct/nodes-request/status/${uuid}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response: AxiosResponse<{ result: any }> = await axios.get(url, {
          headers: this.getAuthorizationHeaders(),
        });

        console.log(`Attempt ${attempt}: Restake Status Response:`, response.data);

        if (response.data.result.status !== "processing") {
          return response.data.result;
        }
      } catch (error) {
        console.error(
          "Error fetching restake status:",
          error instanceof Error ? error.message : "Unknown error",
        );
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error("Restake status is still 'processing' after maximum retries");
  }

  private async createDepositTx(result: any): Promise<any> {
    const url = `${this.apiBaseUrl}eth/staking/direct/tx/deposit`;
    const depositData = result.depositData[0];
    const data = {
      depositData: [
        {
          pubkey: depositData.pubkey,
          signature: depositData.signature,
          depositDataRoot: depositData.depositDataRoot,
        },
      ],
      withdrawalAddress: result.eigenPodAddress,
    };

    try {
      const response: AxiosResponse<{ result: any }> = await axios.post(url, data, {
        headers: this.getAuthorizationHeaders(),
      });
      console.log("Deposit Transaction Response:", response.data);
      pubkey = depositData.pubkey;
      return response.data.result;
    } catch (error) {
      console.error(
        "Error creating deposit transaction:",
        error instanceof Error ? error.message : "Unknown error",
      );
      throw error;
    }
  }

  private async addEthRestaked(depositAmount: string) {
    const { data, error } = await supabase
      .from("eth_restaked")
      .insert([
        {
          deposit_amount: depositAmount,
        },
      ])
      .select();

    if (error) throw new Error(`Insert failed: ${error.message}`);
    return data;
  }

  supportsNetwork = (network: Network) => true;
}

export const stakeActionProvider = () => new StakeActionProvider();
