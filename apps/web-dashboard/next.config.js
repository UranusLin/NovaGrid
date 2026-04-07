/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    if (isServer) {
      config.externals = [...(config.externals || []), '@demox-labs/aleo-sdk'];
    }

    return config;
  },
};

module.exports = nextConfig;
