/** @type {import('next').NextConfig} */
const nextConfig = {
  // The page keeps one signaling socket for the whole share.
  // React Strict Mode mounts twice in development and would drop that socket.
  reactStrictMode: false,
  serverExternalPackages: ["mongodb"],
};

export default nextConfig;
