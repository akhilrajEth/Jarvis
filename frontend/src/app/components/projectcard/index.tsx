"use client";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { useRouter } from "next/navigation";
import { Project } from "./types";
import GithubScoreChip from "../../components/githubscorechip";
import {
  cardStyles,
  imageContainerStyles,
  imageStyles,
  contentStyles,
  titleStyles,
  categoryStyles,
  chipStyles,
} from "./constants";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  return (
    <Card onClick={() => router.push(`/project/${project.id}`)} sx={cardStyles}>
      <Box sx={imageContainerStyles}>
        <Box
          component="img"
          src={project.imagePath || "/images/project-placeholder.svg"}
          alt={project.name}
          sx={imageStyles}
        />
      </Box>
      <CardContent sx={contentStyles}>
        <Typography variant="h6" component="h2" sx={titleStyles}>
          {project.name}
        </Typography>
        <Typography variant="body2" sx={categoryStyles}>
          {project.category}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <GithubScoreChip score={project.githubScore} />
        </Box>
      </CardContent>
    </Card>
  );
}
