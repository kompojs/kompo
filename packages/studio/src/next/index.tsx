'use client'

import { useEffect } from 'react'

/**
 * Next.js component that injects Kompo Studio DevTools in development mode.
 * Add this to your root layout.tsx:
 *
 * ```tsx
 * import { KompoStudio } from '@kompo/studio/next'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <KompoStudio />
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function KompoStudio() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    // Dynamically import the injector — only in dev, client-side only
    import('@kompo/studio/client-src').catch(() => {
      // Silently fail if studio is not available
    })
  }, [])

  return null
}

export default KompoStudio
