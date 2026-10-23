import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Met: Hidden Treasures",
    short_name: "Hidden Treasures",
    description: "10 galleries. 10 mysteries. Can you find them all?",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f1",
    theme_color: "#f4f4f1",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
