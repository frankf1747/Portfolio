/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  /* Production builds use a separate dist dir (set by the build script) so
     running `npm run build` never overwrites a live dev server's chunks. */
  distDir: process.env.NEXT_DIST_DIR || ".next"
};

export default nextConfig;
