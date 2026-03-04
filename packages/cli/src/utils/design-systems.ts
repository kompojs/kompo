export type { DesignSystemId }

/**
 * Centralized configuration for available design systems
 * Used by new.command.ts, list.command.ts and design.generator.ts
 */

export interface DesignSystem {
  id: DesignSystemId
  name: string
  description: string
  hint: string
}

import { listDesignSystems } from '@kompo/blueprints'
import type { DesignSystemId } from '@kompo/config/constants'
import { getFrameworkFamily } from '@kompo/config/constants'

/**
 * Metadata for hardcoded descriptions (fallback/enrichment)
 */
const DS_METADATA: Record<string, Partial<DesignSystem>> = {
  vanilla: { name: 'Vanilla (Standard CSS)', description: 'Standard CSS', hint: 'Standard CSS' },
  tailwind: { name: 'Tailwind CSS', description: 'Utility-first CSS', hint: 'Utility-first CSS' },
  shadcn: { name: 'Shadcn/ui', description: 'Radix + Tailwind', hint: 'Radix + Tailwind' },
  mui: {
    name: 'Material-UI (MUI)',
    description: 'Google Material Design',
    hint: 'Material Design',
  },
  chakra: { name: 'Chakra UI', description: 'Simple and modular', hint: 'Accessible components' },
  radix: { name: 'Radix Primitives', description: 'Headless UI primitives', hint: 'Headless' },
  antd: { name: 'Ant Design', description: 'Enterprise-class UI', hint: 'Enterprise UI' },
}

export function getAvailableDesignSystems(framework?: string): DesignSystem[] {
  const family = framework ? getFrameworkFamily(framework) : undefined
  const discoveredIds = listDesignSystems(family)

  // Merge "known" metadata with whatever is in the blueprints folder
  return discoveredIds.map((id) => ({
    id: id as DesignSystemId,
    name: DS_METADATA[id]?.name || id,
    description: DS_METADATA[id]?.description || id,
    hint: DS_METADATA[id]?.hint || '',
  }))
}

/**
 * Get design system options formatted for @clack/prompts select
 */
export function getDesignSystemSelectOptions(framework?: string) {
  return getAvailableDesignSystems(framework).map((ds) => ({
    label: ds.name,
    value: ds.id,
    hint: ds.hint,
  }))
}

/**
 * Get design system by ID
 */
export function getDesignSystemById(
  id: DesignSystemId,
  framework?: string
): DesignSystem | undefined {
  return getAvailableDesignSystems(framework).find((ds) => ds.id === id)
}

/**
 * Check if a design system ID is valid
 */
export function isValidDesignSystem(id: string, framework?: string): id is DesignSystemId {
  return getAvailableDesignSystems(framework).some((ds) => ds.id === id)
}
