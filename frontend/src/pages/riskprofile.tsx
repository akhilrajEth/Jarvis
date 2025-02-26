import React from "react";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/system";

export default function RiskProfile() {
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
    </Box>
  );
}
