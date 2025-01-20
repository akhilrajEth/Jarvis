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
  similarProjectsContainerStyles,
  mainContentStyles,
} from "./constants";
import { useParams } from "next/navigation";
import { projects } from "../../components/projectcard/types";
import Header from "../../components/Header";
import GithubScoreChip from "../../components/githubscorechip";
import SimilarProjects from "../../components/similarprojectsscrollbar";

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
        <Box sx={mainContentStyles}>
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
            <Typography sx={contentTextStyles}>
              {project.description}
            </Typography>
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
                Batch 1:
                Large addition, unclear portfolio functionality; Good tooling addition, impact on user actions; Single feature, could use more context; Mobile optimization, but unorganized changes; Minor improvement, lacks extensive impact
              </Typography>
              <Typography sx={commitBatchStyles}>
                Batch 2:
                Meaningful update with added functionality.; Large merge, unclear changes without details.; New feature added, but size could be smaller.; Minor updates with unclear context.; Vague commit, lacks clear purpose or benefits.
              </Typography>
              <Typography sx={commitBatchStyles}>
                Batch 3:
                Significant feature addition with a clear purpose.; Large addition with clear feature enhancement goal.; Feature allowing user interaction increases utility.; Trivial change with no impact on functionality.; Bug fix improving functionality with proper scope.
              </Typography>
              <Typography sx={commitBatchStyles}>
                Batch 4:
                Meaningful refactor for tool development.; Refactor with decent scope but lacks tests.; Minor fix, very limited changes.; Trivial checkpoint, no context or purpose.; Trivial checkpoint, lacks meaningful changes.
              </Typography>

              <Typography sx={{ ...contentTextStyles, mt: 2 }}>
                PRs - {project.githubAnalysis.prs}/10
              </Typography>
              <Typography sx={commitBatchStyles}>
                PR #23:
                The pull request suggests modularizing agent invocation and adding a cross-agent tool, but lacks a detailed description or documentation, making it difficult to assess its comprehensiveness and impact fully
              </Typography>
              <Typography sx={commitBatchStyles}>
                PR #41:
                The pull request introduces a portfolio page, but lacks a description and comprehensive details on the feature set, documentation, and its overall impact on the project
              </Typography>
            </Box>

            <Typography sx={subsectionTitleStyles}>Quantitative</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap" }}>
              {project.metrics.map((metric, index) => (
                <Chip key={index} label={metric} sx={quantitativeChipStyles} />
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={similarProjectsContainerStyles}>
          <SimilarProjects currentProjectId={project.id} projects={projects} />
        </Box>
      </Container>
    </>
  );
}
