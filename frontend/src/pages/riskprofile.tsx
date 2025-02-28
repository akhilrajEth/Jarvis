"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import QRCode from "react-qr-code";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk/dist/index.js";
import { supabase } from "../utils/supabaseClient";
import { createHash } from "crypto";
import Link from "next/link";

export default function RiskProfile() {
  const [requestUrl, setRequestUrl] = useState<string>("");
  const [proofs, setProofs] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [allocation, setAllocation] = useState<{
    score: string;
    lp: number;
    restakedETH: number;
  } | null>(null);

  const getVerificationReq = async () => {
    try {
      setLoading(true);
      setError("");
      setRequestUrl("");
      setProofs([]);
      setAllocation(null);

      // 2. Initialize Reclaim protocol
      const APP_ID = process.env.NEXT_PUBLIC_RECLAIM_APP_ID;
      const APP_SECRET = process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET;
      const PROVIDER_ID = process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID;

      const reclaimProofRequest = await ReclaimProofRequest.init(
        APP_ID,
        APP_SECRET,
        PROVIDER_ID
      );

      // Get QR code URL
      const requestUrl = await reclaimProofRequest.getRequestUrl();
      setRequestUrl(requestUrl);

      // Start verification session
      await reclaimProofRequest.startSession({
        onSuccess: (proofs) => {
          // Process successful verification
          console.log("Verification success", proofs);
          setProofs(proofs);

          try {
            const proofData = JSON.parse(proofs.claimData.context);
            const creditScore = parseInt(proofData.extractedParameters.text);

            const riskRanges = {
              "300-578": { score: "Poor", lp: 20, restakedETH: 80 },
              "579-668": { score: "Fair", lp: 35, restakedETH: 65 },
              "669-738": { score: "Good", lp: 50, restakedETH: 50 },
              "739-798": { score: "Very good", lp: 65, restakedETH: 35 },
              "799-850": { score: "Excellent", lp: 80, restakedETH: 20 },
            };

            const allocation = Object.entries(riskRanges).find(([range]) => {
              const [min, max] = range.split("-").map(Number);
              return creditScore >= min && creditScore <= max;
            })?.[1] || { score: "Invalid score", lp: 0, restakedETH: 0 };

            setAllocation(allocation);

            //NOTE: No wallet context since user-management system not implemented yet, thus:
            insertAllocationData(
              "Vitalik",
              allocation.score,
              allocation.lp,
              allocation.restakedETH
            );
          } catch (parseError) {
            setError("Failed to parse verification results");
            console.error("Data Parsing Error:", parseError);
          }
        },
        onError: (error) => {
          console.error("Session Error Details:", {
            error: error instanceof Error ? error.message : "Unknown error",
            sessionId: reclaimProofRequest.sessionId,
            statusUrl,
            timestamp: new Date().toISOString(),
          });

          setError(
            `Verification failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          localStorage.removeItem("reclaimSession");
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start verification process";

      setError(errorMessage);
      console.error("Verification Process Error:", {
        error,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const insertAllocationData = async (
    username: string,
    risk_score: string,
    lp: number,
    restaked_eth: number
  ) => {
    try {
      const dataString = `${username}${risk_score}${lp}${restaked_eth}`;
      const hash = createHash("sha256").update(dataString).digest("hex");

      const { data: existingData, error: checkError } = await supabase
        .from("verified_risk_profile")
        .select("hash")
        .eq("hash", hash)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingData) {
        console.log("Data already exists, skipping insertion");
        return;
      }

      // Insert new data with hash
      const { data, error } = await supabase
        .from("verified_risk_profile")
        .insert([{ username, risk_score, lp, restaked_eth, hash }]);

      if (error) throw error;
      console.log("Data inserted successfully:", data);
    } catch (error) {
      console.error("Error inserting data:", error);
      setError("Failed to save allocation data");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        py: 8,
        px: 2,
        bgcolor: "background.paper",
      }}
    >
      {/* Header Section */}
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 500,
          mb: 4,
          color: "text.primary",
        }}
      >
        Let's understand your risk profile
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 600,
          borderRadius: 4,
          textAlign: "center",
        }}
      >
        {/* Verification Section */}
        {!proofs.length && !allocation && (
          <Stack spacing={3} alignItems="center">
            <Typography variant="h6">
              Verify your credit score to get personalized allocations
            </Typography>

            <Typography variant="body1" color="text.secondary">
              We are using ZKTLS to verify your credit score. This will help us
              recommend the best allocation for you without damaging your credit
              score.
            </Typography>

            <Button
              variant="contained"
              size="large"
              disabled={loading}
              onClick={getVerificationReq}
              sx={{
                backgroundColor: "#000",
                color: "#fff",
                textTransform: "none",
                paddingX: 4,
                borderRadius: "24px",
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Start Verification"
              )}
            </Button>

            {error && (
              <Alert severity="error" sx={{ width: "100%" }}>
                {error}
              </Alert>
            )}

            {requestUrl && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Scan QR Code
                </Typography>
                <QRCode
                  value={requestUrl}
                  size={196}
                  style={{ padding: 8, backgroundColor: "#fff" }}
                />
              </Paper>
            )}
          </Stack>
        )}

        {/* Results Section */}
        {allocation && (
          <Stack spacing={3}>
            <Alert severity="success" sx={{ mb: 2, mt: 8 }}>
              Verification Successful!
            </Alert>

            <Typography variant="h6" component="div">
              Recommended Allocation
            </Typography>

            <Stack direction="row" spacing={2} justifyContent="center">
              <Chip
                label={`Credit Score: ${allocation.score}`}
                color="primary"
                variant="outlined"
              />
            </Stack>

            <Stack direction="row" spacing={4} justifyContent="center">
              <Box textAlign="center">
                <Typography variant="h5" color="primary">
                  {allocation.lp}%
                </Typography>
                <Typography variant="body2">Liquidity Pools</Typography>
              </Box>

              <Box textAlign="center">
                <Typography variant="h5" color="primary">
                  {allocation.restakedETH}%
                </Typography>
                <Typography variant="body2">Restaked ETH</Typography>
              </Box>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Based on your credit score assessment
            </Typography>

            <Link href="/details" passHref>
              <Button
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: "#000",
                  color: "#fff",
                  textTransform: "none",
                  paddingX: 4,
                  borderRadius: "24px",
                  "&:hover": {
                    backgroundColor: "#333",
                  },
                }}
              >
                Next
              </Button>
            </Link>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
