import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // 开启独立部署模式，配合Dockerfile
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
      {
        source: "/docs",
        destination: "http://127.0.0.1:8000/docs",
      },
      {
        source: "/docs/:path*",
        destination: "http://127.0.0.1:8000/docs/:path*",
      },
      {
        source: "/redoc",
        destination: "http://127.0.0.1:8000/redoc",
      },
      {
        source: "/redoc/:path*",
        destination: "http://127.0.0.1:8000/redoc/:path*",
      },
      {
        source: "/openapi.json",
        destination: "http://127.0.0.1:8000/openapi.json",
      },
    ];
  },
};

export default nextConfig;
