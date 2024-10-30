import("./config/index.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("psd");
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
