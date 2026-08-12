import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@my-nextjs-agent/agent", "@my-nextjs-agent/config"],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/chat",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
