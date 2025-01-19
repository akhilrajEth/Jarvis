import { Box, Typography } from "@mui/material";
import ProjectCard from "../projectcard";
import { Project } from "../projectcard/types";
import { similarProjectsBoxStyles, titleStyles } from "./constants";

interface SimilarProjectsProps {
  currentProjectId: string;
  projects: Project[];
}

export default function SimilarProjects({
  currentProjectId,
  projects,
}: SimilarProjectsProps) {
  const similarProjects = projects.filter((p) => p.id !== currentProjectId);

  return (
    <Box>
      <Typography variant="h6" sx={titleStyles}>
        Similar Projects
      </Typography>
      <Box sx={similarProjectsBoxStyles}>
        {similarProjects.map((project) => (
          <Box
            key={project.id}
            sx={{
              width: "100%",
              maxWidth: "240px",
            }}
          >
            <ProjectCard project={project} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
