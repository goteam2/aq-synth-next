import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": require("path").resolve(__dirname, "app"),
      "@/components": require("path").resolve(__dirname, "app/components"),
      "@/lib": require("path").resolve(__dirname, "app/lib"),
      "@/types": require("path").resolve(__dirname, "app/types"),
    };
    return config;
  },
};

export default nextConfig;
