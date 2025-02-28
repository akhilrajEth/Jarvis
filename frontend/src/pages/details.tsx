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
import {
  detailPageStyles,
  allocationItems,
  detailsPageButtonStyles,
} from "./constants";
export default function Allocation() {
  const [expanded, setExpanded] = useState(false);
  const handleChange = (panel) => (_, isExpanded) =>
    setExpanded(isExpanded ? panel : false);

  return (
    <Box sx={detailPageStyles.container}>
      <Typography variant="h4" component="h1" sx={detailPageStyles.title}>
        Here's where your money is going
      </Typography>

      <Paper elevation={0} sx={detailPageStyles.paper}>
        <Typography variant="h6" component="h2" sx={detailPageStyles.subtitle}>
          Allocation Breakdown
        </Typography>

        <Stack spacing={2} sx={{ mb: 4 }}>
          {allocationItems.map((item, index) => (
            <Accordion
              key={index}
              expanded={expanded === `panel${index + 1}`}
              onChange={handleChange(`panel${index + 1}`)}
              sx={detailPageStyles.accordion}
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={detailPageStyles.accordionSummary}
              >
                <Typography variant="subtitle1" fontWeight={500}>
                  {item.title}
                </Typography>
              </AccordionSummary>

              <AccordionDetails>
                <Box sx={detailPageStyles.listContainer}>
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
              sx={detailsPageButtonStyles}
            >
              Next
            </Button>
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}
