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
import { PositionWithTokens } from ",/types";
import {
  positionPageStyles,
  LP_TABLE_HEADERS,
  STAKED_ETH_TABLE_HEADERS,
} from "./constants";

const Positions = () => {
  const [positions, setPositions] = useState<PositionWithTokens[]>([]);
  const [stakedEth, setStakedEth] = useState<number | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleWithdraw = () => {
    console.log("Withdraw clicked");
    // To-DO: Handle withdraw logic once holesky is up
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

  const fetchPositionsData = async () => {
    try {
      setIsLoading(true);
      const ethStaked = await getStakedEthPositionData();
      setStakedEth(ethStaked);

      const initialPositions = await getActivePositionData();

      if (!initialPositions?.length) {
        setIsLoading(false);
        return;
      }

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
            const positionId = position.active_position_id.trim();
            const isValidPosition = (position.name || "").toLowerCase();

            if (isValidPosition.includes("pancakeswap")) {
              try {
                const pancakeData = await getPositionDetails(
                  positionId,
                  "pancake"
                );
                updatedPosition = {
                  ...updatedPosition,
                  token0Amount: pancakeData.token0Amount,
                  token1Amount: pancakeData.token1Amount,
                };
              } catch (error) {
                console.error(
                  `Failed to fetch details for position ${positionId}:`,
                  error
                );
              }
            } else if (isValidPosition.includes("syncswap")) {
              try {
                const swapData = await getPositionDetails(positionId, "sync");
                updatedPosition = {
                  ...updatedPosition,
                  token0Amount: swapData.token0Amount,
                  token1Amount: swapData.token1Amount,
                };
              } catch (error) {
                console.error(
                  `Failed to fetch details for position ${positionId}:`,
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPositionsData();
  }, []);

  const renderHeader = () => (
    <Box sx={positionPageStyles.headerContainer}>
      <Typography
        variant="h5"
        component="div"
        sx={positionPageStyles.headerText}
      >
        Positions
      </Typography>
      <Button
        variant="contained"
        startIcon={<StopIcon />}
        sx={positionPageStyles.stopButton}
        onClick={() => window.location.reload()}
      >
        Stop Agent
      </Button>
    </Box>
  );

  const renderNoPositions = () => (
    <Box sx={positionPageStyles.noPositionsBox}>
      <Typography variant="body1" sx={positionPageStyles.noPositionsText}>
        No current LP positions or staked/restaked ETH
      </Typography>
    </Box>
  );

  const renderLiquidityPositionsTable = () => (
    <Paper elevation={0} sx={positionPageStyles.paper}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              {LP_TABLE_HEADERS.map((header) => (
                <TableCell key={header} sx={positionPageStyles.tableHeader}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.map((position, index) => (
              <TableRow key={index} sx={positionPageStyles.tableRow}>
                <TableCell sx={positionPageStyles.tableCell}>
                  {position.name}
                </TableCell>
                <TableCell sx={positionPageStyles.tableCell}>
                  ${parseFloat(position.tvl).toLocaleString()}
                </TableCell>
                <TableCell sx={positionPageStyles.tableCell}>
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
                <TableCell sx={positionPageStyles.tableCell}>
                  <Box sx={positionPageStyles.addressContainer}>
                    <span style={positionPageStyles.addressText}>
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
                        onClick={() => handleCopyAddress(position.pool_address)}
                        sx={positionPageStyles.copyButton}
                      >
                        <ContentCopyIcon
                          fontSize="small"
                          sx={positionPageStyles.copyIcon}
                        />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell sx={positionPageStyles.tableCell}>
                  {position.token0Amount}
                </TableCell>
                <TableCell sx={positionPageStyles.tableCell}>
                  {position.token1Amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  const renderStakedEthTable = () => (
    <Paper
      elevation={0}
      sx={{
        ...positionPageStyles.stakedEthPaper,
        marginTop: positions.length > 0 ? 12 : 0,
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              {STAKED_ETH_TABLE_HEADERS.map((header) => (
                <TableCell key={header} sx={positionPageStyles.tableHeader}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow sx={positionPageStyles.tableRow}>
              <TableCell sx={positionPageStyles.tableCell}>
                {stakedEth!.toFixed(4)} ETH
              </TableCell>
              <TableCell sx={positionPageStyles.tableCell}>
                <Chip
                  label="Pending"
                  color="warning"
                  sx={{ borderRadius: "6px" }}
                />
              </TableCell>
              <TableCell sx={positionPageStyles.tableCell}>
                <Chip
                  label="Pending"
                  color="warning"
                  sx={{ borderRadius: "6px" }}
                />
              </TableCell>
              <TableCell sx={positionPageStyles.tableCell}>
                <Button
                  variant="outlined"
                  onClick={handleWithdraw}
                  sx={positionPageStyles.withdrawButton}
                >
                  Withdraw
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  const showNoPositions =
    positions.length === 0 && stakedEth === null && !isLoading;
  const showPositionsTable = positions.length > 0;
  const showStakedEthTable = stakedEth !== null;

  return (
    <Box sx={positionPageStyles.container}>
      {renderHeader()}

      {isLoading && <Typography>Loading positions...</Typography>}

      {!isLoading && (
        <>
          {showNoPositions && renderNoPositions()}
          {showPositionsTable && renderLiquidityPositionsTable()}
          {showStakedEthTable && renderStakedEthTable()}
        </>
      )}
    </Box>
  );
};

export default Positions;
