---
title: Deploy Overview
description: Déployez votre application Kompo en production
---

# Deploy - Mettez votre App en Production

Déployer une application Kompo est simple grâce à son architecture découplée. Chaque partie peut être déployée indépendamment selon vos besoins.

## Architecture de Déploiement

### Composants à Déployer

1. **Frontend** - Application Next.js/Vite
2. **API** - Routes API (si séparé du frontend)
3. **Base de Données** - PostgreSQL avec migrations
4. **Services** - Redis, File Storage, etc.
5. **Infrastructure** - Docker, Monitoring, etc.

## Stack Recommandée

| Service | Provider | Pourquoi ? |
|---------|----------|------------|
| **Frontend** | Vercel | Intégration parfaite Next.js, CDN global |
| **Base de Données** | Neon | Serverless PostgreSQL, autoscaling |
| **Backend/Services** | Railway | Docker facile, variables d'env |
| **File Storage** | Pinata/Infura | IPFS optimisé pour NFTs |
| **Monitoring** | LogRocket + Sentry | Errors et performance |

## Étape 1 : Préparer le Production Build

### Variables d'Environnement

Créez `.env.production` :

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Next.js
NEXTAUTH_URL="https://yourapp.com"
NEXTAUTH_SECRET="your-secret-key"

# Wallet/Web3
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="your-project-id"
NEXT_PUBLIC_ALCHEMY_ID="your-alchemy-id"

# Storage
PINATA_JWT="your-pinata-jwt"
PINATA_GATEWAY="https://gateway.pinata.cloud"

# Cache
REDIS_URL="redis://user:pass@host:6379"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
```

### Build Optimisé

```json
// package.json
{
  "scripts": {
    "build": "next build",
    "build:analyze": "ANALYZE=true next build",
    "start": "next start",
    "db:generate": "drizzle-kit generate",
    "db:migrate:prod": "drizzle-kit push --force"
  }
}
```

## Étape 2 : Déployer la Base de Données

### Avec Neon

```bash
# 1. Installer CLI Neon
npm i -g neonctl

# 2. Se connecter
neonctl auth

# 3. Créer la base
neonctl projects create --name my-kompo-app

# 4. Copier la connection string
neonctl connection-string --project-id your-project-id

# 5. Appliquer les migrations
DATABASE_URL="your-neon-url" pnpm db:migrate:prod
```

### Scripts de Migration

```typescript
// scripts/migrate.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from '../shared/adapters/orm/schema'

const migration = async () => {
  const connection = postgres(process.env.DATABASE_URL!)
  const db = drizzle(connection, { schema })
  
  await migrate(db, { migrationsFolder: 'drizzle' })
  
  await connection.end()
}

migration().catch(console.error)
```

## Étape 3 : Déployer sur Vercel

### Configuration Vercel

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Déploiement

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Lier le projet
vercel link

# 3. Déployer
vercel --prod

# 4. Configurer les variables d'env
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
```

### Optimisations Next.js

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@kompo/ui']
  },
  images: {
    domains: ['your-cdn.com', 'gateway.pinata.cloud'],
    formats: ['image/webp', 'image/avif']
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true
}

module.exports = nextConfig
```

## Étape 4 : Déployer les Services

### Railway pour les Services

```dockerfile
// Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

```yaml
// railway.toml
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
```

### Docker Compose Local

```yaml
// docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: kompo
      POSTGRES_USER: kompo
      POSTGRES_PASSWORD: kompo
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://kompo:kompo@postgres:5432/kompo
      REDIS_URL: redis://redis:6379

volumes:
  postgres_data:
```

## Étape 5 : Monitoring & Observabilité

### Sentry pour les Erreurs

```typescript
// apps/web/src/sentry.ts
import * as Sentry from "@sentry/nextjs"

export function initSentry() {
  if (process.env.NODE_ENV === "production") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1
    })
  }
}
```

### Analytics avec Vercel

```typescript
// apps/web/src/app/analytics/route.ts
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Health Checks

```typescript
// apps/web/src/app/api/health/route.ts
import { db } from '@/shared/adapters/orm/db'
import { redis } from '@/shared/adapters/cache/redis'

export async function GET() {
  try {
    // Check DB
    await db.select().from({ dummy: true }).limit(1)
    
    // Check Redis
    await redis.ping()
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        cache: 'ok'
      }
    })
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        error: error.message
      },
      { status: 503 }
    )
  }
}
```

## Étape 6 : CI/CD

### GitHub Actions

```yaml
// .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Scripts de Déploiement

```bash
#!/bin/bash
// scripts/deploy.sh

echo "🚀 Deploying Kompo app..."

# 1. Tests
pnpm test || exit 1

# 2. Build
pnpm build || exit 1

# 3. Database migrations
echo "📊 Running database migrations..."
pnpm db:migrate:prod || exit 1

# 4. Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod || exit 1

# 5. Health check
echo "🏥 Checking health..."
sleep 30
curl -f https://yourapp.com/api/health || exit 1

echo "✅ Deploy successful!"
```

## Sécurité en Production

### HTTPS Headers

```typescript
// apps/web/src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval'"
  )
  
  return response
}
```

### Rate Limiting

```typescript
// apps/web/src/app/api/rate-limit.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
})

export async function rateLimit(ip: string, limit = 10, window = 60000) {
  const key = `rate-limit:${ip}`
  const requests = await redis.incr(key)
  
  if (requests === 1) {
    await redis.expire(key, window / 1000)
  }
  
  return requests <= limit
}
```

## Performance

### Optimisations

::: tip Tips de performance :
- Utilisez <code>next/image</code> pour les images NFT

    - Cachez les métadonnées IPFS avec Redis

    - Pré-générez les pages statiques quand possible

    - Utilisez Edge Functions pour les API légères
:::

### CDN Configuration

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=60, stale-while-revalidate'
          }
        ]
      }
    ]
  }
}
```

## Checklist Pre-Déploiement

<Steps>
  <Step>Tests passants (unitaires + intégration)</Step>
  <Step>Variables d'environnement configurées</Step>
  <Step>Base de données migrée</Step>
  <Step>Sécurité activée (HTTPS, headers)</Step>
  <Step>Monitoring configuré</Step>
  <Step>Health check opérationnel</Step>
  <Step>Backup plan en place</Step>
</Steps>

## Déploiement Multi-Chain

Pour les apps Web3 multi-chaines :

```typescript
// shared/config/chains.ts
export const chains = [
  mainnet,
  polygon,
  base,
  arbitrum
]

// Dans le composant Wallet
import { configureChains, createConfig } from 'wagmi'

const { publicClient } = configureChains(chains, [
  alchemyProvider({ apiKey: process.env.ALCHEMY_ID! }),
  publicProvider()
])
```

## Conclusion

Félicitations ! Votre application Kompo est maintenant en production avec :
- ✅ Architecture scalable et maintenable
- ✅ Séparation claire des responsabilités
- ✅ Monitoring et observabilité
- ✅ Sécurité renforcée
- ✅ Performance optimisée

::: tip
**Need help?** Rejoignez notre Discord pour du support sur le déploiement.
:::
