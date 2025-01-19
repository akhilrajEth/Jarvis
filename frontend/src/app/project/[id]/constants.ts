import { SxProps } from "@mui/material";

export const mainContentStyles: SxProps<Theme> = {
  flex: 1,
};

export const containerStyles: SxProps<Theme> = {
  py: 4,
  px: { xs: 2, sm: 3 },
  maxWidth: "1200px !important",
  display: "flex",
  gap: 4,
};

export const projectHeaderStyles: SxProps<Theme> = {
  display: "flex",
  gap: 3,
  mb: 4,
};

export const projectImageStyles: SxProps<Theme> = {
  width: "140px",
  height: "140px",
  borderRadius: "8px",
  border: "1px solid #eaeaea",
};

export const titleContainerStyles: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

export const titleStyles: SxProps<Theme> = {
  fontSize: "24px",
  fontWeight: 600,
  color: "#111827",
  mb: 1,
};

export const categoryStyles: SxProps<Theme> = {
  fontSize: "14px",
  color: "#6B7280",
  mb: 1,
};

export const sectionStyles: SxProps<Theme> = {
  mb: 4,
};

export const sectionTitleStyles: SxProps<Theme> = {
  fontSize: "18px",
  fontWeight: 600,
  color: "#111827",
  mb: 2,
};

export const contentTextStyles: SxProps<Theme> = {
  fontSize: "14px",
  color: "#4B5563",
  lineHeight: 1.6,
};

export const subsectionTitleStyles: SxProps<Theme> = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#374151",
  mb: 2,
  mt: 3,
};

export const commitBatchStyles: SxProps<Theme> = {
  ml: 3,
  color: "#6B7280",
  fontSize: "14px",
  mb: 1,
};

export const quantitativeChipStyles: SxProps<Theme> = {
  backgroundColor: "#F3F4F6",
  color: "#374151",
  height: "28px",
  fontSize: "13px",
  mr: 1,
  mb: 1,
};

export const similarProjectsContainerStyles: SxProps<Theme> = {
  width: 300,
  flexShrink: 0,
  position: "sticky",
  top: 20,
  alignSelf: "flex-start",
  maxHeight: "calc(100vh - 40px)",
  overflowY: "auto",
};
