/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["ag-grid-react", "ag-grid-community"],
  async redirects() {
    return [{ source: "/finance", destination: "/fees", permanent: false }];
  },
};

export default nextConfig;
