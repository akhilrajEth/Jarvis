"use client";

import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import QRCode from "react-qr-code";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk/dist/index.js";

export default function RiskProfile() {
  const [requestUrl, setRequestUrl] = useState<string>("");
  const [proofs, setProofs] = useState<any[]>([]);

  const getVerificationReq = async () => {
    try {
      const APP_ID = "0x531eB1A7683cE3179F83F812AaBf85a6f3602Ba0";
      const APP_SECRET =
        "0xa4ec041522c8851a8c94e55c6b1019fae3b3ded42663434a01570b2d26c77d89";
      const PROVIDER_ID = "3106a118-26e7-4f02-b718-06e11f5b8954";

      // Initialize Reclaim Proof Request
      const reclaimProofRequest = await ReclaimProofRequest.init(
        APP_ID,
        APP_SECRET,
        PROVIDER_ID
      );

      // Get the request URL for verification
      const requestUrl = await reclaimProofRequest.getRequestUrl();
      console.log("Request URL:", requestUrl);
      setRequestUrl(requestUrl);

      // Start listening for proof submissions
      await reclaimProofRequest.startSession({
        onSuccess: (proofs) => {
          console.log("Verification success", proofs);
          setProofs(proofs);

          // Extract credit score and calculate asset allocation
          let proofData = JSON.parse(proofs.claimData.context);
          let creditScore = parseInt(proofData.extractedParameters.text);

          const riskRanges = {
            "300-578": { score: "Poor", lp: 20, restakedETH: 80 },
            "579-668": { score: "Fair", lp: 35, restakedETH: 65 },
            "669-738": { score: "Good", lp: 50, restakedETH: 50 },
            "739-798": { score: "Very good", lp: 65, restakedETH: 35 },
            "799-850": { score: "Excellent", lp: 80, restakedETH: 20 },
          };

          function getAssetAllocation(creditScore: number) {
            for (const [range, data] of Object.entries(riskRanges)) {
              const [min, max] = range.split("-").map(Number);
              if (creditScore >= min && creditScore <= max) {
                return data;
              }
            }
            return { score: "Invalid score", lp: null, restakedETH: null };
          }

          let assetAllocation = getAssetAllocation(creditScore);

          console.log(
            `Based on your credit score (${assetAllocation.score}), we recommend an asset split of ${assetAllocation.lp}% liquidity pool positions and ${assetAllocation.restakedETH}% restaked ETH.`
          );
        },
        onError: (error) => {
          console.error("Verification failed", error);
        },
      });
    } catch (error) {
      console.error("Error initializing verification request:", error);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        textAlign: "center",
        padding: 2,
      }}
    >
      {/* Main Heading */}
      <Typography
        variant="h4"
        component="h4"
        gutterBottom
        sx={{ fontWeight: 400 }}
      >
        Let's understand your risk profile ...
      </Typography>

      {/* Button to Generate Verification Request */}
      <Button
        variant="contained"
        size="large"
        sx={{
          backgroundColor: "#000",
          color: "#fff",
          textTransform: "none",
          marginTop: 2,
          marginBottom: 2,
        }}
        onClick={getVerificationReq}
      >
        Get Verification Request
      </Button>

      {/* Display QR Code when request URL is available */}
      {requestUrl && (
        <Box sx={{ marginTop: 2 }}>
          <QRCode value={requestUrl} />
        </Box>
      )}

      {/* Display Proofs when verification is successful */}
      {proofs.length > 0 && (
        <Box sx={{ marginTop: 4 }}>
          <Typography variant="h6" component="h6" gutterBottom>
            Verification Successful!
          </Typography>
          <pre
            style={{
              textAlign: "left",
              backgroundColor: "#f4f4f4",
              padding: "10px",
            }}
          >
            {JSON.stringify(proofs, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
}
