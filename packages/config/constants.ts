/**
 * Core Framework Constants
 * Copied from @kompojs/kit to avoid dependency cycles
 */
export const FRAMEWORKS = {
  NEXTJS: 'nextjs',
  REACT: 'react',
  VUE: 'vue',
  NUXT: 'nuxt',
  EXPRESS: 'express',
} as const

export type FrameworkId = (typeof FRAMEWORKS)[keyof typeof FRAMEWORKS]

export const CLIENT_FRAMEWORKS = [
  FRAMEWORKS.REACT,
  FRAMEWORKS.NEXTJS,
  FRAMEWORKS.VUE,
  FRAMEWORKS.NUXT,
] as const
export type ClientFrameworkId = (typeof CLIENT_FRAMEWORKS)[number]

/**
 * Framework Families
 * Maps each framework to its UI component family (react or vue).
 * Used to scope design system selection and UI lib paths.
 */
export const FRAMEWORK_FAMILIES = {
  [FRAMEWORKS.REACT]: 'react',
  [FRAMEWORKS.NEXTJS]: 'react',
  [FRAMEWORKS.VUE]: 'vue',
  [FRAMEWORKS.NUXT]: 'vue',
  [FRAMEWORKS.EXPRESS]: 'none',
} as const

export type FrameworkFamily = 'react' | 'vue' | 'none'

export function getFrameworkFamily(framework: string): FrameworkFamily {
  return (FRAMEWORK_FAMILIES as Record<string, FrameworkFamily>)[framework] ?? 'none'
}

/**
 * Design System Constants
 */
export const DESIGN_SYSTEMS = {
  VANILLA: 'vanilla',
  TAILWIND: 'tailwind',
  SHADCN: 'shadcn',
  MUI: 'mui',
  CHAKRA: 'chakra',
  RADIX: 'radix',
  ANTD: 'antd',
} as const

export type DesignSystemId = (typeof DESIGN_SYSTEMS)[keyof typeof DESIGN_SYSTEMS]
