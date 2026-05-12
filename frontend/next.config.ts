import type { NextConfig } from 'next';

/**
 * Codeplex Chronicle Next.js 16 config.
 * Tech stack lock per PRD Section 17: Three.js 0.184 + r3f 9.6 + React 19.
 *
 * transpilePackages includes Three.js + r3f stack because the libraries ship
 * ESM with internal references that Next.js needs to process for the SSR boundary.
 * Without this, the Canvas mount can throw on first load.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Atlas Wave 3 infra-required patch (Cycle 1):
  // Enable standalone build output so the multi-stage Dockerfile can copy
  // `.next/standalone/server.js` for the runtime stage. Documented in
  // `_meta/decision_log/atlas.md` D-Atlas-04 + uncertainty journal U-Atlas-03.
  output: 'standalone',

  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    '@react-three/postprocessing',
    'postprocessing',
    'r3f-perf',
  ],

  experimental: {
    // Reserved for Wave 2 cache components when Calliope wires landing.
  },

  // Three.js shaders ship as JS, no special loader needed in Next.js 16.
  webpack(config) {
    // Avoid duplicate Three.js copies when r3f + drei + postprocessing
    // independently resolve the dep. Forces single instance.
    // IMPORTANT: `three$` exact-match alias (NOT bare `three`) so subpath
    // imports like `three/examples/jsm/utils/BufferGeometryUtils.js` continue
    // to resolve. Without `$` suffix webpack rewrites subpath to main entry
    // and breaks those imports. Atlas D-Atlas-14 cycle 2.
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      three$: require.resolve('three'),
    };
    return config;
  },
};

export default nextConfig;
