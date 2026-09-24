import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // indicador do modo dev no topo, para não cobrir a bottom bar
  devIndicators: { position: "top-right" },
};

export default nextConfig;
