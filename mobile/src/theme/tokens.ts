/**
 * CAREZOA design tokens. Class-based styling uses NativeWind
 * (tailwind.config.js mirrors these values); import from here for
 * programmatic styles (charts, maps, switch track colors…).
 */
export const colors = {
  brand: "#0E7C7B",
  brandDark: "#0A5C5B",
  brandSoft: "#E0F0EF",
  accent: "#E8654A",
  accentSoft: "#FBEBE7",
  ink: "#1B1F1E",
  soft: "#5F6B68",
  faint: "#9AA5A2",
  paper: "#F6F4EE",
  card: "#FDFDFB",
  line: "#E5E2D8",
  success: "#1F9D6C",
  warn: "#C98A1B",
  danger: "#D3402E",
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xl3: 28,
  full: 999,
} as const;

export const spacing = (n: number) => n * 4;

export const providerPhotoColors: Record<string, string> = {
  moss: "#0E7C7B",
  gold: "#C98A1B",
  lilac: "#6C5CE7",
  sky: "#3E7CB1",
  blush: "#C95D63",
  ink: "#1B1F1E",
};
