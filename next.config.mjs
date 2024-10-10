import("./config/index.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // exclude packages from the server-side bundle
      config.externals.push("tesseract.js");
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.b2bpic.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
