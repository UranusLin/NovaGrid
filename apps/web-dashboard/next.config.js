const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  webpack: (config, { isServer, dev }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Redirect @mui/icons-material/* path imports to the ESM subfolder.
    // @cofhe/react does `import LockIcon from "@mui/icons-material/Lock"` —
    // the CJS version (Lock.js) causes a default-export interop bug.
    // The ESM version (esm/Lock.js) has `export default` directly and works fine.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@mui/icons-material/': path.resolve(
        __dirname,
        'node_modules/@mui/icons-material/esm/'
      ) + '/',
    };

    // @cofhe/react/dist/index.js is ESM (uses import/export syntax) but its
    // package.json lacks "type":"module", so webpack treats it as CJS.
    // Force javascript/esm so webpack correctly handles the default imports
    // from @mui/icons-material/* (otherwise CloseIcon etc. become objects).
    config.module.rules.push({
      test: /\.js$/,
      include: [/node_modules\/@cofhe\/react\/dist\//],
      type: 'javascript/esm',
    });

    if (isServer) {
      config.externals = [...(config.externals || []), '@demox-labs/aleo-sdk'];
    }

    // The Aleo SDK ships a WASM worker that uses top-level await.
    config.module.rules.push({
      test: /\.m?js$/,
      include: [/node_modules\/@demox-labs\/aleo-sdk/],
      type: 'javascript/esm',
      resolve: { fullySpecified: false },
    });

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
