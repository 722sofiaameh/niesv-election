# NIESV Voting

Next.js 14 election voting platform with Prisma and PostgreSQL.

## Setup

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Run migrations and seed:

```bash
npm run db:migrate
npm run db:seed
```

4. Start the dev server:

```bash
npm run dev
```

## Stack

- Next.js 14 (App Router, TypeScript, Tailwind CSS)
- Prisma ORM with PostgreSQL
- shadcn/ui (New York style, neutral base theme)

## Database

Prisma reads `DATABASE_URL` from `.env.local` via `prisma.config.ts` (dotenv workaround).

- **`DATABASE_URL`** — Neon pooler URL (used by the app at runtime)
- **`DIRECT_URL`** — Neon direct URL, same host without `-pooler` (used only for `npm run db:deploy`)

Vercel builds run `prisma generate` only. Apply migrations separately before deploy:

```bash
npm run db:deploy
```

Seed data is loaded from `prisma/data/candidates.json`.
