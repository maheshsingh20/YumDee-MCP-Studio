import { ThemeColors, ThemeMode } from "./types.js";

export const lightColors: ThemeColors = {
  bg: "#F9F6F0",
  surfaceCard1: "#FFFFFF",
  surfaceCard2: "#F3EFE6",
  textHeading: "#1C1917",
  textBody: "#44403C",
  border: "0.5px solid rgba(194, 89, 63, 0.25)",
  accent: "#C2593F",
  accentText: "#C2593F",
  badgeBg: "#526E48",
  badgeText: "#FFFFFF",
  btnFilledBg: "#C2593F",
  btnFilledText: "#FFFFFF",
  btnOutlinedBorder: "0.5px solid #C2593F",
  btnOutlinedText: "#C2593F",
  cardToneA: "#FBF7F1",
  cardToneB: "#F4D9E1",
  inputBg: "#FFFFFF",
};

export const darkColors: ThemeColors = {
  bg: "#141210",
  surfaceCard1: "#1C1916",
  surfaceCard2: "#231F1B",
  textHeading: "#F5EFEB",
  textBody: "#C4BCB5",
  border: "0.5px solid rgba(212, 114, 87, 0.25)",
  accent: "#D47257",
  accentText: "#D47257",
  badgeBg: "#7C9A70",
  badgeText: "#141210",
  btnFilledBg: "#D47257",
  btnFilledText: "#141210",
  btnOutlinedBorder: "0.5px solid #D47257",
  btnOutlinedText: "#D47257",
  cardToneA: "#281A18",
  cardToneB: "#3E2830",
  inputBg: "#12100E",
};

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === "light" ? lightColors : darkColors;
}
