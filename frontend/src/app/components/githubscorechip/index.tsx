import { Chip, SxProps } from "@mui/material";

interface GithubScoreChipProps {
  score: number;
}

const chipStyles: SxProps<Theme> = {
  backgroundColor: "#EFF6FF",
  color: "#2563EB",
  height: "24px",
  fontSize: "13px",
  fontWeight: 500,
  borderRadius: "6px",
};

export default function GithubScoreChip({ score }: GithubScoreChipProps) {
  return (
    <Chip label={`${score}/10 Github Score`} size="small" sx={chipStyles} />
  );
}
