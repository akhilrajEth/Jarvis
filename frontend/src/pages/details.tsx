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

export default function Allocation() {
  const [expanded, setExpanded] = useState(false);
  const handleChange = (panel) => (_, isExpanded) =>
    setExpanded(isExpanded ? panel : false);

  const styles = {
    accordion: {
      border: "1px solid",
      borderColor: "divider",
      borderRadius: "8px !important",
      "&:before": { display: "none" },
      overflow: "hidden",
      mb: 1,
    },
    accordionSummary: {
      bgcolor: "action.hover",
      "&:hover": { bgcolor: "action.selected" },
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        p: 4,
        bgcolor: "background.default",
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 500,
          mb: 4,
          textAlign: "center",
        }}
      >
        Here's where your money is going
      </Typography>

      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 600,
          p: 4,
          borderRadius: 3,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          sx={{
            mb: 4,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          Allocation Breakdown
        </Typography>

        <Stack spacing={3} sx={{ mb: 4 }}>
          {["ZKSync ZKIgnite Program", "Restaked ETH via P2P"].map(
            (title, index) => (
              <Accordion
                key={index}
                expanded={expanded === `panel${index + 1}`}
                onChange={handleChange(`panel${index + 1}`)}
                sx={styles.accordion}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={styles.accordionSummary}
                >
                  <Typography variant="subtitle1">{title}</Typography>
                </AccordionSummary>

                <AccordionDetails>
                  <Typography
                    component="div"
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      "& ul": {
                        listStyle: "disc",
                        pl: 4,
                        display: "block",
                        "& li": {
                          display: "list-item",
                          listStylePosition: "outside",
                          marginLeft: "1rem",
                        },
                      },
                    }}
                  >
                    <ul>
                      {title === "ZKSync ZKIgnite Program"
                        ? [
                            "Participate in ecosystem growth initiatives",
                            "Early-stage dApp testing opportunities",
                            "Layer 2 scaling with reduced fees",
                          ]
                        : [
                            "P2P ETH restaking protocols",
                            "Lower entry barriers",
                            "Enhanced liquidity options",
                          ].map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )
          )}
        </Stack>

        <Box sx={{ display: "flex", justifyContent: "center" }}>
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
        </Box>
      </Paper>
    </Box>
  );
}
