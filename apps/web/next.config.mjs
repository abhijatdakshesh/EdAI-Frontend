/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone output is required for prod container deploys, but it
  // breaks `next start` — which CI/e2e relies on. Set NEXT_DISABLE_STANDALONE=1
  // in CI build to opt out so `next start` works against the build artifact.
  output: process.env.NEXT_DISABLE_STANDALONE ? undefined : "standalone",
  reactStrictMode: true,
  transpilePackages: ["ag-grid-react", "ag-grid-community"],
  async redirects() {
    return [{ source: "/finance", destination: "/fees", permanent: false }];
  },
};

export default nextConfig;
