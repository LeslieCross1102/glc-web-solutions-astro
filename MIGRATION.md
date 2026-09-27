# GLC Web Solutions → EmDash migration

## WordPress export (WXR)

- **Path:** `content/import/glcwebsolutions.WordPress.2026-09-27.xml`
- **Source:** WordPress Tools → Export (full site dump dated 2026-09-27)

## Cloudflare resources

| Resource | Name |
|---|---|
| Worker | `glc-web-solutions` |
| Preview URL | https://glc-web-solutions.gareth-17d.workers.dev/ |
| D1 database | `glc-emdash-db` |
| R2 bucket | `glc-emdash-media` |

`wrangler.jsonc` uses these names so `wrangler deploy` targets the correct Worker.

## Deploy steps

1. Authenticate: `npx wrangler login`
2. Create (or confirm) D1 and R2 if they do not exist yet:
   ```bash
   npx wrangler d1 create glc-emdash-db
   npx wrangler r2 bucket create glc-emdash-media
   ```
3. Paste the returned D1 `database_id` into `wrangler.jsonc` under `d1_databases[0].database_id` (uncomment that field).
4. Install and deploy:
   ```bash
   npm install
   npm run deploy
   ```
5. Open the Worker preview URL and complete EmDash admin setup if prompted.

Optional: connect Cloudflare Workers Builds to this GitHub repo (`LeslieCross1102/glc-web-solutions-astro`) so deploys run from `main` or this branch.

## Import WordPress into EmDash

1. Deploy or run locally (`npm run dev`).
2. Open the EmDash admin UI (`/_emdash/admin`).
3. Use **Import WordPress** and upload `content/import/glcwebsolutions.WordPress.2026-09-27.xml`.
4. Review collections, media, authors, and menus after import completes.

## URL parity notes

WordPress serves posts and pages at **root-level** permalinks (e.g. `/about/`, `/my-post/`).

The EmDash blog seed currently uses:

- Posts: `/posts/{slug}`
- Pages: `/pages/{slug}`

After import, adjust seed `urlPattern` values and matching Astro routes under `src/pages/` if you need WordPress-style root paths. Keep `/category/` and `/tag/` (or map them) as needed, then verify important WP URLs.
