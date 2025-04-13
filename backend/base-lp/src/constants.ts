export const QUERY = `
  {
    pools(orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      feeTier
      totalValueLockedUSD
      volumeUSD
      token1 {
        symbol
        id
      }
      token0 {
        symbol
        id
      }
      poolDayData(first: 7, orderBy: date, orderDirection: desc) {
        feesUSD
      }
      feesUSD
    }
  }
`;
