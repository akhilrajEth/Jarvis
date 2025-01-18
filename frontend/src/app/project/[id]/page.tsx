"use client";
import { Container, Typography, Box, Paper, Chip } from "@mui/material";
import { useParams } from "next/navigation";
import { projects } from "../../components/projectcard/types";
import Header from "../../components/Header";

export default function ProjectDetail() {
  const params = useParams();
  const project = projects.find((p) => p.id === params.id);

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontFamily: "Quantico", mb: 2, fontWeight: "bold" }}
          >
            {project.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {project.category}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Chip
              label={`GitHub Score ${project.githubScore}/10`}
              sx={{ backgroundColor: "#2196F3", color: "white" }}
            />
          </Box>
        </Box>

        <Paper
          sx={{
            p: 4,
            mb: 3,
            border: "1px solid #eaeaea",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            Project Description
          </Typography>
          <Typography color="text.secondary">{project.description}</Typography>
        </Paper>

        <Paper
          sx={{
            p: 4,
            mb: 3,
            border: "1px solid #eaeaea",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
            GitHub Analysis
          </Typography>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
              Qualitative
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              README - {project.githubAnalysis.readme}/10:{" "}
              {project.githubAnalysis.readmeDetails}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              Commits - {project.githubAnalysis.commits}/10:{" "}
              {project.githubAnalysis.commitsDetails}
            </Typography>
            <Typography color="text.secondary">
              PRs - {project.githubAnalysis.prs}/10
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
              Quantitative
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {project.metrics.map((metric, index) => (
                <Chip
                  key={index}
                  label={metric}
                  variant="outlined"
                  sx={{ border: "1px solid #eaeaea" }}
                />
              ))}
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
