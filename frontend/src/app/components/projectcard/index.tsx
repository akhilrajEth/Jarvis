"use client";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { useRouter } from "next/navigation";
import { Project } from "./types";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  return (
    <Card
      onClick={() => router.push(`/project/${project.id}`)}
      sx={{
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-4px)",
          transition: "transform 0.2s ease-in-out",
        },
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          component="h2"
          sx={{ fontFamily: "Quantico", mb: 1 }}
        >
          {project.name}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {project.category}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={`${project.githubScore}/10 GitHub Score`}
            size="small"
            sx={{ backgroundColor: "#2196F3", color: "white" }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
