/** Approved "Dusk" palette. Mirrors the --color-dusk-* tokens in globals.css. */
export const dusk = {
  bg: "#1d1a17",
  surface: "#26221e",
  fill: "#3a2f25",
  accent: "#e3c49f",
  text: "#d9d0c3",
  muted: "#8f857a",
  tabbar: "#191714",
} as const;

/**
 * shadcn/ui (and Kokonut UI) color variables, mapped onto Dusk.
 * Mirrors the :root block in globals.css. Solid "primary" buttons use the
 * calm fill with amber text, like the big log button; never bright amber.
 */
export const shadcnTokens = {
  background: dusk.bg,
  foreground: dusk.text,
  card: dusk.surface,
  "card-foreground": dusk.text,
  popover: dusk.surface,
  "popover-foreground": dusk.text,
  primary: dusk.fill,
  "primary-foreground": dusk.accent,
  secondary: dusk.surface,
  "secondary-foreground": dusk.text,
  muted: dusk.surface,
  "muted-foreground": dusk.muted,
  accent: dusk.fill,
  "accent-foreground": dusk.accent,
  destructive: "#c98a6b", // muted terracotta, not alarm red
  border: dusk.fill,
  input: dusk.fill,
  ring: dusk.accent,
  "chart-1": dusk.accent,
  "chart-2": "#c9a27a",
  "chart-3": "#a8825f",
  "chart-4": dusk.muted,
  "chart-5": "#6b5a49",
  sidebar: dusk.tabbar,
  "sidebar-foreground": dusk.text,
  "sidebar-primary": dusk.fill,
  "sidebar-primary-foreground": dusk.accent,
  "sidebar-accent": dusk.surface,
  "sidebar-accent-foreground": dusk.accent,
  "sidebar-border": dusk.fill,
  "sidebar-ring": dusk.accent,
} as const;
