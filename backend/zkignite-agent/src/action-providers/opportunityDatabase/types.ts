export interface OpportunityRecord {
  opportunity_id: string;
  protocol: "PancakeSwap" | "SyncSwap";
  totalAPR: string;
  poolAddress: string;
  token0Address: string;
  token1Address: string;
  active_positions: string;
}
