/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize playwright-core to prevent webpack from bundling it
      config.externals = config.externals || []
      config.externals.push('playwright-core')
    }
    return config
  },
}

module.exports = nextConfig
