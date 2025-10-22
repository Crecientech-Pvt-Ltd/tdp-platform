import nextra from "nextra";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  outputFileTracingRoot: process.cwd(),
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
  },
  turbopack: {},
  transpilePackages: ["shiki"],
};

const withNextra = nextra({
  contentDirBasePath: "/docs",
  defaultShowCopyCode: true,
});

export default withNextra(nextConfig);
