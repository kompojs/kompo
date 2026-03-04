export interface TemplateConfig {
  version: number
  name: string
  description: string
  category: string
  tags: string[]
  frameworks: string[]
  dependencies: string[]
  history: Array<{
    action: string
    plugin?: string
    template?: string
    app: string
    adapter?: string
  }>
}

export interface TemplateOptions {
  framework?: string
}
