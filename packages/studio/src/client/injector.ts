/**
 * Kompo Studio — Framework-agnostic DevTools injector.
 *
 * This module is designed to be bundled as a self-contained IIFE that includes
 * its own copy of React, ReactDOM, and all UI dependencies. It can be injected
 * into ANY web application regardless of framework (React, Vue, Nuxt, Svelte, plain HTML).
 *
 * The studio renders inside an isolated container with a CSS reset so host app
 * styles don't leak in and studio styles don't leak out.
 */

import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { StudioRoot } from './studio-root'

const STUDIO_CONTAINER_ID = '__kompo-studio__'
const SHORTCUT_KEY = 'k'

// CSS reset scoped to the studio container — prevents host app styles from leaking in
const STUDIO_CSS_RESET = `
#${STUDIO_CONTAINER_ID},
#${STUDIO_CONTAINER_ID} *,
#${STUDIO_CONTAINER_ID} *::before,
#${STUDIO_CONTAINER_ID} *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 100%;
  font: inherit;
  vertical-align: baseline;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
#${STUDIO_CONTAINER_ID} button {
  cursor: pointer;
  font-family: inherit;
}
#${STUDIO_CONTAINER_ID} input {
  font-family: inherit;
}
#${STUDIO_CONTAINER_ID} a {
  color: inherit;
  text-decoration: none;
}
`

function injectStyles() {
  if (document.getElementById('__kompo-studio-styles__')) return
  const style = document.createElement('style')
  style.id = '__kompo-studio-styles__'
  style.textContent = STUDIO_CSS_RESET
  document.head.appendChild(style)
}

function injectStudio() {
  if (document.getElementById(STUDIO_CONTAINER_ID)) return

  injectStyles()

  const container = document.createElement('div')
  container.id = STUDIO_CONTAINER_ID
  container.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    color: #e2e8f0;
    line-height: 1.5;
  `
  document.body.appendChild(container)

  // Mount a completely independent React root — does NOT interfere with the host app's React/Vue/etc.
  const root = createRoot(container)
  root.render(createElement(StudioRoot))
}

function printConsoleHint() {
  console.log(
    '%c✨ Kompo Studio %c Press Ctrl + K to open DevTools',
    'background: #7c3aed; color: white; padding: 2px 8px; border-radius: 3px; font-weight: bold;',
    'color: #a78bfa; padding: 2px 4px;'
  )
}

// Auto-init when loaded
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectStudio()
      printConsoleHint()
    })
  } else {
    injectStudio()
    printConsoleHint()
  }
}

// Global keyboard shortcut (Ctrl+K)
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === SHORTCUT_KEY) {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('kompo-studio:toggle'))
    }
  })
}

export { injectStudio }
