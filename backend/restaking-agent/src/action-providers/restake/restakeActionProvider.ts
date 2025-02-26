import { ActionProvider, EvmWalletProvider, Network, CreateAction } from "@coinbase/agentkit";
import { z } from "zod";
import { RestakeSchema } from "./schemas";
import axios, { AxiosResponse } from "axios";

import { signAndBroadcast } from "../utils";

export class RestakeActionProvider extends ActionProvider {
  constructor() {
    super("restake", []);
  }

  private API_BASE_URL = "https://api-test-holesky.p2p.org/api/v1/";
  private authToken = "Bearer scwaeTkXzol07FHmCSzJSMAc9v64qAVp";

  private VALIDATOR_PUB_KEY =
    "0x800934f77ed347994543783357b7ac27c98dd12d71c19c170830b3290fedd750266637854f8d3547bc23fa03fa9d2485";
  private OPERATOR_ADDRESS = "0x37d5077434723d0ec21d894a52567cbe6fb2c3d8";

  @CreateAction({
    name: "retake",
    description: "Uses P2P API to restake 32 ETH",
    schema: RestakeSchema,
  })
  async executeRestaking(wallet: EvmWalletProvider) {
    try {
      console.log("Starting restaking process...");

      console.log("Step 1: Checking if Validator is Active...");
      await this.checkValidatorStatus(this.VALIDATOR_PUB_KEY);
      console.log("Validator is active. Proceeding with restaking process...");

      console.log("Step 2: Activating Restake Request...");
      const restakeActivation = await this.createActivateRestakeRequest(
        this.VALIDATOR_PUB_KEY,
        wallet.getAddress(),
      );
      console.log("Restake Activated:", restakeActivation);

      console.log("Step 3: Delegating to Operator...");
      const delegateResponse = await this.createDelegateOperatorTx(this.OPERATOR_ADDRESS);
      console.log("Delegation Transaction Response:", delegateResponse);

      console.log("Signing and Broadcasting Delegation Transaction...");
      const signedDelegateTx = await signAndBroadcast(wallet, {
        txHex: delegateResponse.serializeTx,
        gasLimit: delegateResponse.gasLimit,
        maxFeeGas: delegateResponse.maxFeePerGas,
        maxPriorityFeeGas: delegateResponse.maxPriorityFeePerGas,
        amount: delegateResponse.value,
      });
      console.log("Delegation Transaction Broadcasted:", signedDelegateTx.hash);
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

  private async checkValidatorStatus(pubkey: string): Promise<void> {
    const url = `${this.API_BASE_URL}eth/staking/direct/validator/status`;
    console.log("PUB KEY:", pubkey);
    const data = { pubkeys: [pubkey] };

    try {
      const response: AxiosResponse<any> = await axios.post(url, data, {
        headers: this.getAuthorizationHeaders(),
      });

      const validatorStatus = response.data.result.list[0]?.status;
      console.log(`Validator Status: ${validatorStatus}`);

      if (validatorStatus !== "active_ongoing") {
        throw new Error("Validator is not yet active.");
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(
        "Error checking validator status:",
        axiosError.response?.data || axiosError.message,
      );
      throw error;
    }
  }

  private async createActivateRestakeRequest(pubKey: string, stakerAddress: string): Promise<any> {
    const url = `${this.API_BASE_URL}eth/staking/eigenlayer/tx/verify-withdrawal-credentials`;
    const data = {
      eigenPodOwnerAddress: stakerAddress,
      pubKey: pubKey,
    };

    try {
      const response: AxiosResponse<any> = await axios.post(url, data, {
        headers: this.getAuthorizationHeaders(),
      });
      console.log("Restake Request Response:", response.data);
      return response.data.result;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(
        "Error initiating restake request:",
        axiosError.response?.data || axiosError.message,
      );
      throw error;
    }
  }

  private async createDelegateOperatorTx(operatorAddress: string): Promise<any> {
    const url = `${this.API_BASE_URL}eth/staking/eigenlayer/tx/delegate-to`;
    const data = { operatorAddress };

    try {
      const response: AxiosResponse<any> = await axios.post(url, data, {
        headers: this.getAuthorizationHeaders(),
      });
      console.log("Delegate Request Response:", response.data);
      return response.data.result;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(
        "Error initiating delegate request:",
        axiosError.response?.data || axiosError.message,
      );
      throw error;
    }
  }

  supportsNetwork = (network: Network) => true;
}

export const restakeActionProvider = () => new RestakeActionProvider();
