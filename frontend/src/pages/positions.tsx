import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import StopIcon from "@mui/icons-material/Stop";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  getActivePositionData,
  getPositionDetails,
  getStakedEthPositionData,
} from "../utils/fetchData";

type PositionWithTokens = {
  active_position_id: string;
  pool_address: string;
  name: string;
  tvl: string;
  total_apr: string;
  token0Amount?: string;
  token1Amount?: string;
};

const Positions = () => {
  const [positions, setPositions] = useState<PositionWithTokens[]>([]);
  const [stakedEth, setStakedEth] = useState<number | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const formatPercentage = (apr: string) => {
    try {
      const numericValue = parseFloat(apr.replace("%", ""));
      return `${numericValue.toFixed(2)}%`;
    } catch {
      return "0.00%";
    }
  };

  const formatTokenAmount = (amount?: string) => {
    if (!amount) return "-";
    try {
      return parseFloat(amount).toFixed(2);
    } catch {
      return "-";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ethStaked = await getStakedEthPositionData();
        setStakedEth(ethStaked);

        const initialPositions = await getActivePositionData();

        if (!initialPositions?.length) return;

        const mergedPositions = await Promise.all(
          initialPositions
            // First filter out invalid positions
            .filter(
              (p) =>
                p.active_position_id &&
                typeof p.active_position_id === "string" &&
                p.active_position_id.trim() !== ""
            )
            // Then process valid positions
            .map(async (position) => {
              let updatedPosition: PositionWithTokens = { ...position };

              // Only process PancakeSwap positions with valid ID
              if (position.name?.toLowerCase().includes("pancakeswap")) {
                try {
                  const pancakeData = await getPositionDetails(
                    position.active_position_id.trim(), // Ensure clean string
                    "pancake"
                  );
                  updatedPosition = {
                    ...updatedPosition,
                    token0Amount: pancakeData.token0Amount,
                    token1Amount: pancakeData.token1Amount,
                  };
                } catch (error) {
                  console.error(
                    `Failed to fetch details for position ${position.active_position_id}:`,
                    error
                  );
                }
              } else if (position.name?.toLowerCase().includes("syncswap")) {
                try {
                  const swapData = await getPositionDetails(
                    position.active_position_id.trim(), // Ensure clean string
                    "sync"
                  );
                  updatedPosition = {
                    ...updatedPosition,
                    token0Amount: swapData.token0Amount,
                    token1Amount: swapData.token1Amount,
                  };
                } catch (error) {
                  console.error(
                    `Failed to fetch details for position ${position.active_position_id}:`,
                    error
                  );
                }
              }

              return updatedPosition;
            })
        );

        setPositions(mergedPositions);
      } catch (error) {
        console.error("Error fetching positions:", error);
      }
    };

    fetchData();
  }, []);

  {
    positions.length == 0 && stakedEth === null;
  }

  return (
    <Box sx={{ maxWidth: "100%", padding: 4, marginTop: 8 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 3,
        }}
      >
        <Typography
          variant="h5"
          component="div"
          sx={{ fontWeight: 500, color: "#212121" }}
        >
          Positions
        </Typography>
        <Button
          variant="contained"
          startIcon={<StopIcon />}
          sx={{
            textTransform: "none",
            backgroundColor: "#000",
            color: "#fff",
            borderRadius: "24px",
            padding: "8px 16px",
            "&:hover": { backgroundColor: "#333" },
          }}
          onClick={() => window.location.reload()}
        >
          Stop Agent
        </Button>
      </Box>

      {positions.length === 0 && stakedEth === null && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 300,
            backgroundColor: "#fafafa",
            borderRadius: 2,
            marginTop: 2,
          }}
        >
          <Typography
            variant="body1"
            sx={{ color: "#757575", fontSize: "1.1rem" }}
          >
            No current LP positions or staked/restaked ETH
          </Typography>
        </Box>
      )}

      {positions.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  {[
                    "Liqudity Pool Opportunity",
                    "TVL",
                    "Total APR",
                    "Pool Address",
                    "Token0 Amount",
                    "Token1 Amount",
                  ].map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#424242",
                        paddingY: 2,
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.map((position, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      "&:hover": { backgroundColor: "#f9f9f9" },
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    <TableCell sx={{ paddingY: 2 }}>{position.name}</TableCell>
                    <TableCell sx={{ paddingY: 2 }}>
                      ${parseFloat(position.tvl).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ paddingY: 2 }}>
                      <Chip
                        label={formatPercentage(position.total_apr)}
                        size="small"
                        sx={{
                          backgroundColor:
                            parseFloat(position.total_apr) >= 10
                              ? "#e1f5fe"
                              : "#f0f4c3",
                          color:
                            parseFloat(position.total_apr) >= 10
                              ? "#0277bd"
                              : "#827717",
                          borderRadius: "6px",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ paddingY: 2 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <span
                          style={{
                            maxWidth: "120px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {position.pool_address}
                        </span>
                        <Tooltip
                          title={
                            copiedAddress === position.pool_address
                              ? "Copied!"
                              : "Copy to clipboard"
                          }
                          arrow
                        >
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleCopyAddress(position.pool_address)
                            }
                            sx={{ padding: 0.5 }}
                          >
                            <ContentCopyIcon
                              fontSize="small"
                              sx={{ width: 16, height: 16 }}
                            />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ paddingY: 2 }}>
                      {position.token0Amount}
                    </TableCell>
                    <TableCell sx={{ paddingY: 2 }}>
                      {position.token1Amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {stakedEth !== null && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            marginTop: positions.length > 0 ? 12 : 0,
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  {[
                    "Staked Amount",
                    "Stake Status",
                    "Restake Status",
                    "Withdraw",
                  ].map(
                    // Added Withdraw column
                    (header) => (
                      <TableCell
                        key={header}
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          color: "#424242",
                          paddingY: 2,
                        }}
                      >
                        {header}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                  <TableCell sx={{ paddingY: 2 }}>
                    {stakedEth.toFixed(4)} ETH
                  </TableCell>
                  <TableCell sx={{ paddingY: 2 }}>
                    <Chip
                      label="Pending"
                      color="warning"
                      sx={{ borderRadius: "6px" }}
                    />
                  </TableCell>
                  <TableCell sx={{ paddingY: 2 }}>
                    <Chip
                      label="Pending"
                      color="warning"
                      sx={{ borderRadius: "6px" }}
                    />
                  </TableCell>
                  <TableCell sx={{ paddingY: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => console.log("Withdraw clicked")} // Add your withdraw logic here
                      sx={{
                        borderColor: "#000",
                        color: "#000",
                        textTransform: "none",
                        borderRadius: "20px",
                        padding: "4px 16px",
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                          borderColor: "#000",
                        },
                      }}
                    >
                      Withdraw
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default Positions;
