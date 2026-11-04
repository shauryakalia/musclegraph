/** @type {import('next').NextConfig} */
const nextConfig = {
  // `next build` writes a fully static site to ./out (no Node server needed).
  output: "export",
  // /exercises/back-squat/ → out/exercises/back-squat/index.html (works on any static host).
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
