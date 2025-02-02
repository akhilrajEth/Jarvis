import { Grid, Container, Typography } from "@mui/material";
import ProjectCard from "./components/projectcard";
import { projects } from "./components/projectcard/types";
import Header from "./components/header";

export default function Home() {
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 6,
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Find new projects you'll love on Base and Solana
        </Typography>
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <ProjectCard project={project} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}
