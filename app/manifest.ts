import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nexa — AI Automation Workspace",
    short_name: "Nexa",
    description:
      "An AI operating system for the rest of us. Tell Nexa what you want done, and watch it happen.",
    start_url: "/chat",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/api/icon/192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/icon/512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/api/icon/maskable-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/api/icon/maskable-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["productivity", "utilities"],
    shortcuts: [
      {
        name: "New Chat",
        short_name: "Chat",
        description: "Start a new AI conversation",
        url: "/chat",
      },
    ],
  };
}
