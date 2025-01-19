import { SxProps } from "@mui/material";

export const cardStyles: SxProps<Theme> = {
  cursor: "pointer",
  border: "1px solid #f0f0f0",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
  transition: "all 0.2s ease-in-out",
  backgroundColor: "#ffffff",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    borderColor: "#e6e6e6",
  },
};

export const imageContainerStyles: SxProps<Theme> = {
  width: "100%",
  paddingTop: "70%",
  backgroundColor: "#fafafa",
  borderBottom: "1px solid #f5f5f5",
  position: "relative",
  overflow: "hidden",
};

export const imageStyles: SxProps<Theme> = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

export const contentStyles: SxProps<Theme> = {
  pt: 2.5,
  pb: "20px !important",
  px: 2.5,
};

export const titleStyles: SxProps<Theme> = {
  fontWeight: 600,
  fontSize: "1.125rem",
  mb: 1.5,
  color: "#111827",
  lineHeight: 1.3,
};

export const categoryStyles: SxProps<Theme> = {
  fontSize: "0.875rem",
  color: "#6B7280",
  mb: 1.5,
  fontWeight: 400,
  lineHeight: 1.5,
};

export const chipStyles: SxProps<Theme> = {
  backgroundColor: "#EFF6FF",
  color: "#2563EB",
  height: "24px",
  fontSize: "0.8125rem",
  fontWeight: 500,
  borderRadius: "6px",
  "& .MuiChip-label": {
    padding: "0 10px",
    letterSpacing: "-0.01em",
  },
};
