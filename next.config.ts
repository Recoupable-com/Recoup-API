import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    RESOURCE_WALLET_ADDRESS: process.env.RESOURCE_WALLET_ADDRESS,
  },
};

export default nextConfig;
