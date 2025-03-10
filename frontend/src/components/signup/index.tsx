import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { supabase } from "../../utils/supabaseClient";

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
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Sign Up
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Button
          onClick={handleGoogleSignup}
          variant="contained"
          fullWidth
          sx={{
            mt: 2,
            borderRadius: "16px",
            backgroundColor: "#4285F4",
            color: "white",
            "&:hover": {
              backgroundColor: "#357ae8",
            },
          }}
        >
          Sign Up with Google
        </Button>
      </DialogContent>
    </Dialog>
  );
}
