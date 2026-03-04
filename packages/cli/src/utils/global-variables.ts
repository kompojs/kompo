/**
 * Global variables used across all templates
 * These values are shared across all frameworks and design systems
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOCIALS_DIR = join(__dirname, '../../../assets/socials')
const LOGOS_DIR = join(__dirname, '../../../assets/')

function loadLogo(name: string): string {
  try {
    return readFileSync(join(LOGOS_DIR, `${name}.svg`), 'utf-8').trim()
  } catch {
    return ''
  }
}

function loadSocialIcon(name: string): string {
  try {
    return readFileSync(join(SOCIALS_DIR, `${name}.svg`), 'utf-8').trim()
  } catch {
    return ''
  }
}

export const GLOBAL_VARIABLES = {
  // Branding
  branding: {
    name: 'Kompo',
    tagline: 'Code Orchestration Platform',
    url: 'https://kompo.dev',
    icon: loadLogo('kompo_icon'),
    horizontalLogo: loadLogo('kompo_horizontal'),
    verticalLogo: loadLogo('kompo_vertical'),
  },

  // Social Links
  socialLinks: {
    github: 'https://github.com/nicmusic/kompo',
    twitter: 'https://twitter.com/nicmusic_xyz',
    farcaster: 'https://warpcast.com/nicmusic.eth',
  },

  // Text content
  texts: {
    hero: {
      title: 'Welcome to',
      description:
        "Built with Kompo's composable hexagonal architecture. Swap adapters without changing your code.",
    },
    features: {
      getStarted: {
        title: 'Get started',
        description: 'Build your first Kompo project with the following commands:',
        commands: [
          'kompo add domain user',
          'kompo add use-case createUser',
          'kompo add adapter orm',
        ],
        url: 'https://kompo.dev/docs/get-started',
        linkText: 'View Guide',
      },
      docs: {
        title: 'Documentation',
        description: 'We highly recommend you take a look at the Kompo documentation to level up.',
        details: 'Learn best practices, patterns, and advanced features of Kompo.',
        url: 'https://kompo.dev/docs',
        urlGetStarted: 'https://kompo.dev/docs/get-started',
        linkText: 'Open Docs',
      },
      blueprints: {
        title: 'Blueprints',
        description: 'Discover our collection of blueprints to supercharge your Kompo project.',
        url: 'https://kompo.dev/blueprints',
      },
      examples: {
        title: 'Examples',
        description: 'Explore different ways of using Kompo features and get inspired.',
        url: 'https://kompo.dev/examples',
      },
      deploy: {
        title: 'Deploy',
        description: 'Learn how to deploy your Kompo project on different providers.',
        url: 'https://kompo.dev/deploy',
      },
    },
    footer: 'Built with Kompo',
  },

  // Social icon SVGs loaded from packages/assets/socials/
  socialIcons: {
    github: loadSocialIcon('github'),
    x: loadSocialIcon('x'),
    discord: loadSocialIcon('discord'),
    linkedin: loadSocialIcon('linkedin'),
    mastodon: loadSocialIcon('mastodon'),
    farcaster: loadSocialIcon('farcaster'),
    youtube: loadSocialIcon('youtube'),
    bluesky: loadSocialIcon('bluesky'),
  },

  // Default ports
  studioPort: 9000,
} as const

// Helper function to merge global variables with template data
export function mergeWithGlobals<T extends Record<string, unknown>>(
  data: T
): T & typeof GLOBAL_VARIABLES {
  return {
    ...GLOBAL_VARIABLES,
    ...data,
  }
}
