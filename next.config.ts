import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf", "mammoth", "bcryptjs", "@prisma/client", "pdf-lib"],
};

export default nextConfig;
