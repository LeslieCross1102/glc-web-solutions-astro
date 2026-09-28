import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, kvCache, r2 } from "@emdash-cms/cloudflare";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
	site: "https://glcwebsolutions.co.uk",
	output: "server",
	adapter: cloudflare(),
	// Workers Cache (wrangler "cache.enabled"): public pages opt in from Base.astro, EmDash purges by tag on save
	cache: {
		provider: { name: "cloudflare", entrypoint: new URL("./src/cache-provider.ts", import.meta.url) },
	},
	build: { inlineStylesheets: "always" },
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			siteUrl: "https://glcwebsolutions.co.uk",
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			// Shares the adapter's SESSION namespace; KV Free allows 1,000 writes/day, so keep the TTL long
			objectCache: kvCache({ binding: "SESSION", keyPrefix: "emdash-cache:", defaultTtl: 900 }),
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "IBM Plex Sans",
			cssVariable: "--font-body",
			weights: [400, 500, 600, 700],
			fallbacks: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "IBM Plex Mono",
			cssVariable: "--font-mono",
			weights: [400, 500],
			fallbacks: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
		},
	],
	devToolbar: { enabled: false },
});
