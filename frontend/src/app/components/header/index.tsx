import { AppBar, Toolbar, Typography, Link } from "@mui/material";

export default function Header() {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "white",
      }}
    >
      <Toolbar>
        <Link
          href="http://localhost:3000"
          underline="none"
          sx={{ cursor: "pointer" }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "#000",
              fontWeight: "bold",
            }}
          >
            Jarvis
          </Typography>
        </Link>
      </Toolbar>
    </AppBar>
  );
}
