import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fara cacheComponents: aplicatia e integral per-utilizator (sesiune in cookie),
  // prerandarea partiala nu aduce nimic aici.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
