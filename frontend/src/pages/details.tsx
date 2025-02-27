"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Link from "next/link";

export default function Allocation() {
  const [expanded, setExpanded] = useState(false);
  const handleChange = (panel) => (_, isExpanded) =>
    setExpanded(isExpanded ? panel : false);

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100vh",
      p: 4,
      bgcolor: "#ffffff", // Pure white background
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
      borderBottom: expanded ? "1px solid #eaeaea" : "none",
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

  // Data structure for allocation items
  const allocationItems = [
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

  return (
    <Box sx={styles.container}>
      <Typography variant="h4" component="h1" sx={styles.title}>
        Here's where your money is going
      </Typography>

      <Paper elevation={0} sx={styles.paper}>
        <Typography variant="h6" component="h2" sx={styles.subtitle}>
          Allocation Breakdown
        </Typography>

        <Stack spacing={2} sx={{ mb: 4 }}>
          {allocationItems.map((item, index) => (
            <Accordion
              key={index}
              expanded={expanded === `panel${index + 1}`}
              onChange={handleChange(`panel${index + 1}`)}
              sx={styles.accordion}
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={styles.accordionSummary}
              >
                <Typography variant="subtitle1" fontWeight={500}>
                  {item.title}
                </Typography>
              </AccordionSummary>

              <AccordionDetails>
                <Box sx={styles.listContainer}>
                  {item.details.map((detail, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        mb: 1.5,
                      }}
                    >
                      <Typography component="span" sx={{ mr: 1.5 }}>
                        •
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {detail}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Link href="/launch" passHref>
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
        </Box>
      </Paper>
    </Box>
  );
}
