import type { NextConfig } from "next";
import path from "path";

process.env.NAPI_RS_FORCE_WASI = "true";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@noble/hashes/crypto": path.resolve(__dirname, "src/lib/shims/noble-hashes-crypto.ts"),
    };
    return config;
  },
};

export default nextConfig;
