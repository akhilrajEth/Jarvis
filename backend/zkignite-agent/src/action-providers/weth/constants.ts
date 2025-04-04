// ZKSync Native Weth
export const WETH_ADDRESS = "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91";

export const WETH_ABI = [
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
