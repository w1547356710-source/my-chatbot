import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@my-nextjs-agent/agent"],
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
