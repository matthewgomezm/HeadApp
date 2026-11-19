import type { MetadataRoute } from "next";
import { dusk } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Migraine Tracker",
    short_name: "Migraines",
    start_url: "/",
    display: "standalone",
    background_color: dusk.bg,
    theme_color: dusk.bg,
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
