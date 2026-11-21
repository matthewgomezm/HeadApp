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

/** Day: warm light (chosen over pure white, 2026-11-20). Mirrors :root in globals.css. */
export const dayPalette = {
  bg: "#f4ede3",
  surface: "#fbf6ef",
  fill: "#e9dccb",
  accent: "#7c4f24",
  text: "#3b322a",
  muted: "#6c6054",
  tabbar: "#ece2d4",
} as const;

/**
 * shadcn/ui (and Kokonut UI) color variables, mapped onto the theme variables
 * (--dusk-*, which change between day and night). Solid "primary" buttons use
 * the calm fill with accent text, like the big log button.
 */
export const shadcnTokens = {
  background: "var(--dusk-bg)",
  foreground: "var(--dusk-text)",
  card: "var(--dusk-surface)",
  "card-foreground": "var(--dusk-text)",
  popover: "var(--dusk-surface)",
  "popover-foreground": "var(--dusk-text)",
  primary: "var(--dusk-fill)",
  "primary-foreground": "var(--dusk-accent)",
  secondary: "var(--dusk-surface)",
  "secondary-foreground": "var(--dusk-text)",
  muted: "var(--dusk-surface)",
  "muted-foreground": "var(--dusk-muted)",
  accent: "var(--dusk-fill)",
  "accent-foreground": "var(--dusk-accent)",
  destructive: "var(--dusk-destructive)",
  border: "var(--dusk-fill)",
  input: "var(--dusk-fill)",
  ring: "var(--dusk-accent)",
  "chart-1": "var(--dusk-accent)",
  "chart-2": "var(--dusk-chart-2)",
  "chart-3": "var(--dusk-chart-3)",
  "chart-4": "var(--dusk-muted)",
  "chart-5": "var(--dusk-chart-5)",
  sidebar: "var(--dusk-tabbar)",
  "sidebar-foreground": "var(--dusk-text)",
  "sidebar-primary": "var(--dusk-fill)",
  "sidebar-primary-foreground": "var(--dusk-accent)",
  "sidebar-accent": "var(--dusk-surface)",
  "sidebar-accent-foreground": "var(--dusk-accent)",
  "sidebar-border": "var(--dusk-fill)",
  "sidebar-ring": "var(--dusk-accent)",
} as const;
