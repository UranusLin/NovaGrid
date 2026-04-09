/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, dev }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    if (isServer) {
      config.externals = [...(config.externals || []), '@demox-labs/aleo-sdk'];
    }

    // The Aleo SDK ships a WASM worker that uses top-level await.
    // Tell webpack to treat it as an ESM module so Terser accepts the syntax.
    config.module.rules.push({
      test: /\.m?js$/,
      include: [/node_modules\/@demox-labs\/aleo-sdk/],
      type: 'javascript/esm',
      resolve: { fullySpecified: false },
    });

    // In production, configure Terser to accept ES2020+ module syntax
    if (!dev) {
      config.optimization.minimizer = (config.optimization.minimizer ?? []).map(
        (minimizer) => {
          if (minimizer?.constructor?.name === 'TerserPlugin') {
            minimizer.options.terserOptions = {
              ...(minimizer.options?.terserOptions ?? {}),
              ecma: 2020,
              module: true,
            };
          }
          return minimizer;
        }
      );
    }

    return config;
  },
};

module.exports = nextConfig;
