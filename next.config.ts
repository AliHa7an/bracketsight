import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The five engines are workspace source packages, not built artefacts.
  transpilePackages: [
    "@/engines/repayment",
    "@/engines/paycheck",
    "@/engines/aca",
    "@/engines/property",
    "@/engines/trades",
    "@/components/ui",
  ],
};

export default nextConfig;
