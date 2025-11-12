import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // ✅ This makes Next.js create static HTML files
  images: {
    unoptimized: true, // ✅ Needed for export to work properly
  },
};

export default nextConfig;
