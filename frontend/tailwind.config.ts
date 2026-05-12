import type { Config } from 'tailwindcss';

/**
 * Codeplex Chronicle Tailwind config.
 * Dark cinematic-first palette per PRD Section 13.2 (Living City Visual Quality Bar).
 *
 * Color tokens align with the night HDRI default + Bloom emissive glow surfaces
 * Iris paints on building archetypes. Calliope (Wave 1 landing) + Hera (Wave 2
 * Sprint overlay) consume the same tokens to keep cross-page typography + glow
 * coherent (Eunomia audit Designer cohesion item).
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Night sky core, used as Canvas clearColor fallback before HDRI loads.
        'codeplex-void': '#05070d',
        'codeplex-shadow': '#0b0f1a',
        // Warm key light tint (interior glow window emissive base).
        'codeplex-ember': '#ffb472',
        // Cool fill tint (moon directional light).
        'codeplex-moon': '#7d9cff',
        // Resident landmark accent (Bloom tip color for emissive markers).
        'codeplex-athena': '#c8b6ff',
        'codeplex-apollo': '#ffd6a5',
        'codeplex-argus': '#fdffb6',
        'codeplex-clio': '#a0c4ff',
        'codeplex-hermes': '#ffadad',
      },
      fontFamily: {
        // Designer mandate cross-page consistency. Calliope/Hestia/Selene inherit.
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      backdropBlur: {
        glass: '14px',
      },
    },
  },
  plugins: [],
};

export default config;
