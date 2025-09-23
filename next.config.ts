import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  webpack: (config) => {
    config.module.rules.push({
      test: /\.ttf$/i,
      type: "asset/resource",
    });
    return config;
  }
};

export default nextConfig;
