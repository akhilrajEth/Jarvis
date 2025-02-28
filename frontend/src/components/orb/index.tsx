"use client";

import { styled } from "@mui/system";
import { GlowOrbProps } from "./types";

const Orb = styled("div", {
  shouldForwardProp: (prop) =>
    !["size", "color", "top"].includes(prop.toString()),
})<GlowOrbProps>(
  ({ theme, size = 120, color = "rgba(100, 150, 255, 0.4)", top = "20%" }) => ({
    width: size,
    height: size,
    borderRadius: "50%",
    background: "transparent",
    boxShadow: `0 0 80px 40px ${color}, 
              0 0 100px 60px rgba(100, 150, 255, 0.2)`,
    position: "absolute",
    top: top,
    zIndex: 0,
    animation: "pulse 4s ease-in-out infinite",
    "@keyframes pulse": {
      "0%, 100%": { transform: "scale(1)" },
      "50%": { transform: "scale(1.05)", opacity: 0.8 },
    },
  })
);

export const GlowOrb = ({ size, color, top }: GlowOrbProps) => {
  return <Orb size={size} color={color} top={top} />;
};
