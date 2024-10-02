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
};

export default nextConfig;
