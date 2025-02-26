"use client";

import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { styled } from "@mui/system";
import { GlowOrb } from "../components/orb";

import Link from "next/link";

export default function Home() {
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
      <GlowOrb size={150} color="rgba(100, 200, 255, 0.3)" top="15%" />

      {/* Main Heading */}
      <Typography
        variant="h2"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 500, pt: 8 }}
      >
        Hey, I’m Jarvis{" "}
        <span role="img" aria-label="waving hand">
          👋
        </span>
      </Typography>

      {/* Subheading */}
      <Typography variant="h5" component="p" gutterBottom>
        I can optimize your DeFi yield for you.
      </Typography>

      {/* Secondary Text */}
      <Typography
        variant="body1"
        component="p"
        sx={{ fontStyle: "italic", color: "gray", marginBottom: 4 }}
      >
        No manual tweaking needed – just set it and forget it.
      </Typography>

      {/* Get Started Button */}
      <Link href="/riskprofile" passHref>
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
          Get Started
        </Button>
      </Link>
    </Box>
  );
}
