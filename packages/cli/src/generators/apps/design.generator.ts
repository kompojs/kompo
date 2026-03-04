import path from 'node:path'
import { log, spinner } from '@clack/prompts'
import type { FrameworkId } from '@kompo/config/constants'
import { getFrameworkFamily } from '@kompo/config/constants'
import { LIBS_DIR } from '@kompo/kit'
import color from 'picocolors'
import { createFsEngine } from '../../engine/fs-engine'
import type { DesignSystemId } from '../../utils/design-systems'
import { getTemplateEngine } from '../../utils/project'

export interface DesignGeneratorContext {
  targetDir: string
  designSystem: DesignSystemId
  scope: string
  blueprintPath?: string
  framework?: FrameworkId
}

/**
 * Resolves the UI lib blueprint path based on framework family.
 * e.g. react + tailwind → libs/ui/react/tailwind
 *      nuxt + tailwind  → libs/ui/vue/tailwind
 */
function resolveUiLibPath(designSystem: string, framework?: string): string {
  const family = getFrameworkFamily(framework ?? '')
  return path.join('libs', 'ui', family, designSystem)
}

export async function generateDesignSystem(ctx: DesignGeneratorContext) {
  const { targetDir, designSystem, scope } = ctx

  if (designSystem === 'vanilla') {
    return
  }

  const s = spinner()
  s.start(`Setting up ${color.cyan(designSystem)} design system...`)

  const fs = createFsEngine()
  const templates = await getTemplateEngine(ctx.blueprintPath)

  // Get repo root (parent of apps/)
  // targetDir is usually .../apps/app-name
  const repoRoot = path.dirname(path.dirname(targetDir))
  const libsDir = LIBS_DIR
  const family = getFrameworkFamily(ctx.framework ?? '')
  const uiLibDir = path.join(repoRoot, libsDir, `ui-${family}`)

  // Resolve family-scoped UI lib blueprint path (e.g. libs/ui/react/tailwind)
  const templatePath = resolveUiLibPath(designSystem, ctx.framework)

  if (
    (await templates.exists(path.join(templatePath, 'files'))) &&
    !(await fs.fileExists(path.join(uiLibDir, 'package.json')))
  ) {
    await templates.renderDir(
      path.join(templatePath, 'files'),
      uiLibDir,
      {
        scope,
        family,
        tsconfigPath: path.relative(
          uiLibDir,
          path.join(repoRoot, 'libs', 'config', 'tsconfig.base.json')
        ),
      },
      { merge: false }
    )
  } else if (!(await templates.exists(templatePath))) {
    // For design systems without shared templates (like MUI), skip shared UI generation
    log.warn(`No shared UI template found for ${designSystem}, skipping...`)
  }

  // Check for workspace-scripts snippet in blueprint
  s.stop(color.green(`Design system ${designSystem} setup complete!`))
}
