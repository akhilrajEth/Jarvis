export type ActivePositionDetails = {
  active_position_id: string;
  pool_address: string;
  name: string;
  tvl: string;
  total_apr: string;
};

export type PositionData = {
  token0Amount: string;
  token1Amount: string;
  uncollectedFees: {
    token0: string;
    token1: string;
  };
};
