# Mi Vestidor 👔

Tu guardarropa digital — catalogá, combiná, planificá.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Prisma** + Neon (Postgres)
- **NextAuth** (Google OAuth)
- **Cloudinary** (fotos + background removal)
- **Claude Vision** (auto-tag IA)
- **Vercel** (deploy)

## Setup

### 1. Clonar e instalar

```bash
git clone https://github.com/TU_USER/mi-vestidor.git
cd mi-vestidor
npm install
```

### 2. Crear cuentas (todos free tier)

| Servicio | URL | Para qué |
|----------|-----|----------|
| Neon | neon.tech | Base de datos Postgres |
| Cloudinary | cloudinary.com | Almacenamiento de fotos + bg removal |
| Google Cloud Console | console.cloud.google.com | OAuth credentials |
| Anthropic | console.anthropic.com | Claude Vision API |

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Completar cada variable en .env
```

**Google OAuth:**
1. Ir a Google Cloud Console → APIs & Services → Credentials
2. Crear OAuth 2.0 Client ID
3. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Copiar Client ID y Secret al `.env`

**Cloudinary:**
1. Dashboard → Account Details → copiar Cloud Name, API Key, API Secret
2. Para background removal: Settings → Add-ons → activar "Cloudinary AI Background Removal"

**NextAuth Secret:**
```bash
openssl rand -base64 32
```

### 4. Inicializar base de datos

```bash
npx prisma db push
```

### 5. Correr en local

```bash
npm run dev
```

### 6. Deploy a Vercel

```bash
vercel
# Agregar las env vars en Vercel Dashboard → Settings → Environment Variables
# Actualizar NEXTAUTH_URL a la URL de producción
# Agregar la callback URL de producción en Google Cloud Console
```

## Estructura

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth
│   │   ├── items/                 # CRUD prendas
│   │   └── upload/                # Upload + IA
│   ├── login/                     # Login page
│   ├── layout.tsx
│   └── page.tsx                   # Dashboard
├── components/
│   ├── Catalog.tsx                # Grilla + filtros
│   ├── ItemCard.tsx               # Card de prenda
│   ├── Navbar.tsx                 # Barra superior
│   ├── Providers.tsx              # Session + Toast
│   └── UploadModal.tsx            # Subida + review IA
├── lib/
│   ├── ai-tagger.ts              # Claude Vision
│   ├── auth.ts                    # NextAuth config
│   ├── cloudinary.ts              # Upload + transformations
│   ├── constants.ts               # Categorías, temporadas
│   └── prisma.ts                  # DB client
└── types/
    └── next-auth.d.ts
```

## Roadmap

- [x] Fase 1: Catálogo + stock (upload, IA tags, filtros)
- [ ] Fase 2: Armador de outfits (combinar prendas)
- [ ] Fase 3: Calendario (planificar outfits por día)
- [ ] Fase 4: Estadísticas (uso, cost-per-wear, huecos)
