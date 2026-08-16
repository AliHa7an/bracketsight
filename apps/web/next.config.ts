import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The five engines are workspace source packages, not built artefacts.
  transpilePackages: [
    "@fineprint/engine-repayment",
    "@fineprint/engine-paycheck",
    "@fineprint/engine-aca",
    "@fineprint/engine-property",
    "@fineprint/engine-trades",
    "@fineprint/ui",
  ],
};

export default nextConfig;
