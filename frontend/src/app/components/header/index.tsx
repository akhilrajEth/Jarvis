import { AppBar, Toolbar, Typography } from "@mui/material";

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
        <Typography
          variant="h6"
          sx={{
            color: "#000",
            fontFamily: "Quantico",
            fontWeight: "bold",
          }}
        >
          Jarvis
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
