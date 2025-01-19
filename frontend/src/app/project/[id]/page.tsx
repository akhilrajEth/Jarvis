"use client";
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  SxProps,
  Theme,
} from "@mui/material";
import {
  containerStyles,
  projectHeaderStyles,
  projectImageStyles,
  titleContainerStyles,
  titleStyles,
  categoryStyles,
  sectionStyles,
  sectionTitleStyles,
  contentTextStyles,
  subsectionTitleStyles,
  commitBatchStyles,
  quantitativeChipStyles,
} from "./constants";
import { useParams } from "next/navigation";
import { projects } from "../../components/projectcard/types";
import Header from "../../components/Header";
import GithubScoreChip from "../../components/githubscorechip";

export default function ProjectDetail() {
  const params = useParams();
  const project = projects.find((p) => p.id === params.id);

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <>
      <Header />
      <Container sx={containerStyles}>
        <Box sx={projectHeaderStyles}>
          <Box
            component="img"
            src={project.imagePath || "/images/project-placeholder.svg"}
            alt={project.name}
            sx={projectImageStyles}
          />
          <Box sx={titleContainerStyles}>
            <Typography sx={titleStyles}>{project.name}</Typography>
            <Typography sx={categoryStyles}>{project.category}</Typography>
            <GithubScoreChip score={project.githubScore} />
          </Box>
        </Box>

        <Box sx={sectionStyles}>
          <Typography sx={sectionTitleStyles}>Project Description</Typography>
          <Typography sx={contentTextStyles}>{project.description}</Typography>
        </Box>

        <Box sx={sectionStyles}>
          <Typography sx={sectionTitleStyles}>Github Analysis</Typography>

          <Typography sx={subsectionTitleStyles}>Qualitative</Typography>
          <Box sx={{ mb: 2 }}>
            <Typography sx={contentTextStyles}>
              README - {project.githubAnalysis.readme}/10:{" "}
              {project.githubAnalysis.readmeDetails}
            </Typography>

            <Typography sx={{ ...contentTextStyles, mt: 2 }}>
              Commits - {project.githubAnalysis.commits}/10:
            </Typography>
            {/* Batch details */}
            <Typography sx={commitBatchStyles}>
              Batch 1: Mostly deletions, unclear improvements
            </Typography>
            <Typography sx={commitBatchStyles}>
              Batch 2: Focused commits with mixed improvements
            </Typography>
            <Typography sx={commitBatchStyles}>
              Batch 3: Mix of trivial and meaningful changes
            </Typography>
            <Typography sx={commitBatchStyles}>
              Batch 4: Mixed changes, unclear purposes, trivial doc updates
            </Typography>

            <Typography sx={{ ...contentTextStyles, mt: 2 }}>
              PRs - {project.githubAnalysis.prs}/10
            </Typography>
          </Box>

          <Typography sx={subsectionTitleStyles}>Quantitative</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap" }}>
            {project.metrics.map((metric, index) => (
              <Chip key={index} label={metric} sx={quantitativeChipStyles} />
            ))}
          </Box>
        </Box>
      </Container>
    </>
  );
}
