"use client";

import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { styled } from "@mui/system";
import { GlowOrb } from "../components/orb";
import Stack from "@mui/material/Stack";
import { useRouter } from "next/navigation";

export default function Launch() {
  const router = useRouter();

  const handleLaunch = async () => {
    try {
      const restakingAgentResponse = await fetch(
        "http://localhost:3001/run-agent"
      );
      const zkIgniteAgentResponse = await fetch(
        "http://localhost:3005/run-agent"
      );

      if (restakingAgentResponse.ok && zkIgniteAgentResponse.ok) {
        const result = await restakingAgentResponse.text();
        router.push("/positions");
      }
    } catch (error) {
      console.error("Error triggering agent:", error);
      router.push("/connection-error");
    }
  };

  return (
    <Box sx={launchBoxStyles}>
      <Stack spacing={4} sx={{ alignItems: "center" }}>
        <GlowOrb size={150} color="rgba(100, 200, 255, 0.3)" top="15%" />

        {/* Main Heading */}
        <Typography
          variant="h3"
          component="h2"
          gutterBottom
          sx={{ fontWeight: 500 }}
        >
          Are you ready to launch your agent?
        </Typography>

        {/* Get Started Button */}
        <Button
          variant="contained"
          size="large"
          sx={launchButtonStyles}
          onClick={handleLaunch}
        >
          Launch
        </Button>
      </Stack>
    </Box>
  );
}
