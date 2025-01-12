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
        hostname: "img.freepik.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.b2bpic.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "downloadscdn5.freepik.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "normacolor-staging.s3.us-east-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
