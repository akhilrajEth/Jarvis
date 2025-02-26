export interface PodResponse {
  serializeTx: string;
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  value: string;
}

export interface RestakeRequestResult {
  depositData: Array<{
    pubkey: string;
    signature: string;
    depositDataRoot: string;
  }>;
  eigenPodAddress: string;
}

export interface RestakeStatusResult extends RestakeRequestResult {
  status: string;
}

export interface DepositTxResponse {
  serializeTx: string;
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  value: string;
}
