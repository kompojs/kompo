import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Kompo',
  description: 'Build Web3 apps faster and professionally with hexagonal architecture',
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    fr: {
      label: 'Français',
      lang: 'fr',
      link: '/fr/',
      themeConfig: {
        nav: [
          { text: 'Accueil', link: '/fr/' },
          { text: 'Introduction', link: '/fr/intro' },
          { text: 'Démarrage rapide', link: '/fr/quick-start' },
          { text: 'CLI', link: '/fr/cli/overview' },
          { text: 'Templates', link: '/fr/templates/overview' },
        ],
        sidebar: [
          {
            text: 'Démarrage',
            items: [
              { text: 'Introduction', link: '/fr/intro' },
              { text: 'Démarrage Rapide', link: '/fr/quick-start' },
              { text: 'Votre Premier Domaine', link: '/fr/your-first-domain' },
              { text: 'Structure du Projet', link: '/fr/project-structure' },
            ],
          },
          {
            text: 'CLI',
            items: [
              { text: 'Vue d\'ensemble', link: '/fr/cli/overview' },
              {
                text: 'Commandes',
                items: [
                  { text: 'kompo add app', link: '/fr/cli/commands/add-app' },
                  { text: 'kompo add', link: '/fr/cli/commands/add' },
                ],
              },
            ],
          },
        ],
      },
    },
  },

  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Introduction', link: '/intro' },
      { text: 'Quick Start', link: '/quick-start' },
      { text: 'CLI', link: '/cli/overview' },
      { text: 'Templates', link: '/templates/overview' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/intro' },
          { text: 'Quick Start', link: '/quick-start' },
          { text: 'Your First Domain', link: '/your-first-domain' },
          { text: 'Project Structure', link: '/project-structure' },
          { text: 'Developer Experience', link: '/developer-experience' },
        ],
      },
      {
        text: 'Understanding Kompo',
        items: [
          { text: 'Architecture', link: '/understand/architecture' },
          { text: 'Domain', link: '/understand/domain' },
          { text: 'Ports & Adapters', link: '/understand/ports-adapters' },
          { text: 'Composition', link: '/understand/composition' },
          { text: 'Blueprints', link: '/understand/blueprints' },
          { text: 'Terminology', link: '/understand/terminology' },
          { text: 'Package Management', link: '/understand/package-management' },
          { text: 'Environment Variables', link: '/understand/environment-variables' },
        ],
      },
      {
        text: 'CLI',
        items: [
          { text: 'Overview', link: '/cli/overview' },
          { text: 'Usage', link: '/cli/usage' },
          { text: 'Workflow', link: '/cli/workflow' },
          { text: 'Config', link: '/cli/config' },
          {
            text: 'Commands',
            items: [
              { text: 'kompo add app', link: '/cli/commands/add-app' },
              { text: 'kompo add', link: '/cli/commands/add' },
              { text: 'kompo generate', link: '/cli/commands/generate' },
            ],
          },
        ],
      },
      {
        text: 'Templates',
        items: [
          { text: 'Overview', link: '/templates/overview' },
          { text: 'NFT Marketplace', link: '/templates/nft-marketplace' },
          { text: 'DAO Governance', link: '/templates/dao-governance' },
          { text: 'Token Detection', link: '/templates/token-detection' },
          { text: 'Create Custom Template', link: '/templates/create-custom' },
        ],
      },
      {
        text: 'Build',
        items: [{ text: 'Build Overview', link: '/build/overview' }],
      },
      {
        text: 'Deploy',
        items: [
          { text: 'Deploy Overview', link: '/deploy/overview' },
          { text: 'Platforms', link: '/deploy/platforms' },
          { text: 'Environment Variables', link: '/deploy/env-vars' },
          { text: 'Checklist', link: '/deploy/checklist' },
        ],
      },
      {
        text: 'Studio',
        items: [
          { text: 'Overview', link: '/studio/overview' },
          { text: 'Architecture Graph', link: '/studio/architecture-graph' },
          { text: 'Stack Inspector', link: '/studio/stack-inspector' },
          { text: 'Dependency Viewer', link: '/studio/dependency-viewer' },
        ],
      },
      {
        text: 'Extensibility',
        items: [{ text: 'Extensibility', link: '/extensibility' }],
      },
    ],
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kompo-dev/kompo' },
      { icon: 'twitter', link: 'https://twitter.com/kompo_js' },
    ],
    outline: {
      level: [2, 3],
    },
    editLink: {
      pattern: 'https://github.com/kompo-dev/kompo/edit/main/packages/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
