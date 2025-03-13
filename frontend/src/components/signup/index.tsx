import React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { supabase } from "../../utils/supabaseClient";
import GoogleLogo from "./googlelogo";
import { IconButtonStyles, GoogleButtonStyles } from "./constants";

export default function SignupPopup({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
      onClose();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          padding: "24px",
        },
      }}
    >
      <IconButton aria-label="close" onClick={onClose} sx={IconButtonStyles}>
        <CloseIcon />
      </IconButton>

      <DialogTitle component="div" sx={{ p: 0, mb: 3 }}>
        <Typography
          variant="h4"
          align="center"
          fontWeight="semibold"
          gutterBottom
        >
          Welcome!
        </Typography>
        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          sx={{ fontSize: "0.9rem" }}
        >
          We're excited to have you onboard! Sign in or sign up by clicking the
          button below.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Button
            onClick={handleGoogleSignup}
            variant="contained"
            startIcon={<GoogleLogo />}
            sx={GoogleButtonStyles}
          >
            Continue with Google
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
