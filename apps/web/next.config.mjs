/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["ag-grid-react", "ag-grid-community"],
  async redirects() {
    return [{ source: "/finance", destination: "/fees", permanent: false }];
  },
};

export default nextConfig;
