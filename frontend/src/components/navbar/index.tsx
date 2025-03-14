"use client";

import React, { useState, useEffect } from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useAuth } from "../../providers/authprovider";
import { supabase } from "../../utils/supabaseClient";
import { useRouter } from "next/navigation";
import { ButtonStyles, AppBarStyles } from "./constants";
import SignupPopup from "../signup";

export default function Navbar() {
  const { session } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsAuthenticated(!!session);
  }, [session]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleSignup = (email: string, password: string) => {
    console.log("Signup attempt with:", { email, password });
  };

  const handleAuth = async () => {
    console.log("INSIDE HANDLE AUTH");
    if (isAuthenticated) {
      console.log("INSIDE IS AUTHENTICATED PART");
      await supabase.auth.signOut();
      const { data } = await supabase.auth.getSession();
      console.log("DATA SESSION:", data.session);
      setIsAuthenticated(!!data.session);
      router.push("/");
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <AppBar position="static" elevation={0} sx={AppBarStyles}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              color: "text.primary",
            }}
          >
            Jarvis
          </Typography>

          <Box>
            <Button
              onClick={handleAuth}
              variant="contained"
              color="primary"
              sx={ButtonStyles}
            >
              {isAuthenticated ? "Sign Out" : "Sign In"}
            </Button>
            <Typography>{isAuthenticated}</Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <SignupPopup open={open} onClose={handleClose} onSignup={handleSignup} />
    </>
  );
}
