import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PayHub AI",
    short_name: "PayHub",
    description: "Know where your money goes.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f2f5fa",
    theme_color: "#0a2766",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Check a price", url: "/pay" },
      { name: "Money Hub", url: "/hub" },
      { name: "Ask AI", url: "/chat" },
    ],
  };
}
