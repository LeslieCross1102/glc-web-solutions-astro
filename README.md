# GLC Web Solutions (EmDash on Cloudflare)

Official [EmDash](https://github.com/emdash-cms/emdash) Cloudflare blog template, configured for **GLC Web Solutions** and ready for WordPress (WXR) import.

- **Worker:** `glc-web-solutions` → https://glc-web-solutions.gareth-17d.workers.dev/
- **Database (D1):** `glc-emdash-db`
- **Media (R2):** `glc-emdash-media`
- **WXR export:** `content/import/glcwebsolutions.WordPress.2026-09-27.xml`

See [MIGRATION.md](./MIGRATION.md) for Cloudflare deploy and WordPress import steps.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:4321/_emdash/admin and complete the setup wizard. EmDash applies migrations and the blog seed during setup.

## Deploy

```bash
npx wrangler login
npm run deploy
```

First deploy provisions D1/R2 from `wrangler.jsonc` (or bind existing `glc-emdash-db` / `glc-emdash-media` resources).

## Stack

- EmDash CMS (`emdash`, `@emdash-cms/cloudflare`)
- Astro 7 + `@astrojs/cloudflare`
- Cloudflare Workers, D1, R2
