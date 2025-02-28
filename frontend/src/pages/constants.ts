export const detailPageStyles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "100vh",
    p: 4,
    bgcolor: "#ffffff",
  },
  title: {
    fontWeight: 500,
    mb: 4,
    textAlign: "center",
  },
  subtitle: {
    mb: 4,
    textAlign: "center",
    color: "#555",
    fontWeight: 500,
  },
  paper: {
    width: "100%",
    maxWidth: 600,
    p: 4,
    borderRadius: 2,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)", // Subtle shadow
    bgcolor: "#ffffff",
  },
  accordion: {
    boxShadow: "none",
    border: "1px solid #eaeaea",
    borderRadius: "8px !important",
    "&:before": { display: "none" },
    overflow: "hidden",
    mb: 2,
  },
  accordionSummary: {
    borderBottom: "1px solid #eaeaea",
    "&:hover": { bgcolor: "#fafafa" },
  },
  listContainer: {
    pl: 2,
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    mb: 1.5,
  },
  bullet: {
    mr: 1.5,
    fontSize: "0.8rem",
    color: "#777",
  },
};

export const allocationItems = [
  {
    title: "LP Pools on ZKSync's ZKIgnite Program",
    details: [
      "Streaming 300M ZK tokens (~30M USD)",
      "Boosting LP opportunities over 9 months",
      "Opportunites + boosted APR changes every 2 weeks",
    ],
  },
  {
    title: "Restaked ETH via P2P",
    details: [
      "Distributing rewards across 35+ networks (~$7B staked)",
      "Takes 1 day to stake and 7 days to unstake",
      "Enhancing staking yields over variable terms",
    ],
  },
];

export const detailsPageButtonStyles = {
  backgroundColor: "#000",
  color: "#fff",
  textTransform: "none",
  paddingX: 4,
  borderRadius: "24px",
  "&:hover": {
    backgroundColor: "#333",
  },
};

export const launchBoxStyles = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  textAlign: "center",
  padding: 2,
};

export const launchButtonStyles = {
  backgroundColor: "#000",
  color: "#fff",
  textTransform: "none",
  paddingX: 4,
  borderRadius: "24px",
  "&:hover": {
    backgroundColor: "#333",
  },
};

export const positionPageStyles = {
  container: { maxWidth: "100%", padding: 4, marginTop: 8 },
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  headerText: { fontWeight: 500, color: "#212121" },
  stopButton: {
    textTransform: "none",
    backgroundColor: "#000",
    color: "#fff",
    borderRadius: "24px",
    padding: "8px 16px",
    "&:hover": { backgroundColor: "#333" },
  },
  noPositionsBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
    backgroundColor: "#fafafa",
    borderRadius: 2,
    marginTop: 2,
  },
  noPositionsText: { color: "#757575", fontSize: "1.1rem" },
  paper: {
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  tableHeader: {
    fontWeight: 600,
    fontSize: "0.875rem",
    color: "#424242",
    paddingY: 2,
  },
  tableRow: {
    "&:hover": { backgroundColor: "#f9f9f9" },
    transition: "background-color 0.2s ease",
  },
  tableCell: { paddingY: 2 },
  addressContainer: { display: "flex", alignItems: "center", gap: 1 },
  addressText: {
    maxWidth: "120px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  copyButton: { padding: 0.5 },
  copyIcon: { width: 16, height: 16 },
  stakedEthPaper: {
    borderRadius: "12px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    marginTop: 12,
  },
  withdrawButton: {
    borderColor: "#000",
    color: "#000",
    textTransform: "none",
    borderRadius: "20px",
    padding: "4px 16px",
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.04)",
      borderColor: "#000",
    },
  },
};

export const LP_TABLE_HEADERS = [
  "Liqudity Pool Opportunity",
  "TVL",
  "Total APR",
  "Pool Address",
  "Token0 Amount",
  "Token1 Amount",
];

export const STAKED_ETH_TABLE_HEADERS = [
  "Staked Amount",
  "Stake Status",
  "Restake Status",
  "Withdraw",
];
