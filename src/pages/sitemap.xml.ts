import type { APIRoute } from "astro";

/**
 * Sitemap index. Lists the Yoast paths already submitted to Google Search Console;
 * src/worker.ts serves the page and post ones from EmDash's per-collection sitemaps.
 */
const SITEMAPS = ["page-sitemap.xml", "post-sitemap.xml", "category-sitemap.xml"];

export const GET: APIRoute = ({ site, url }) => {
	const base = site ?? new URL(url.origin);
	const entries = SITEMAPS.map(
		(path) => `  <sitemap>\n    <loc>${new URL(path, base).href}</loc>\n  </sitemap>`,
	);

	return new Response(
		[
			'<?xml version="1.0" encoding="UTF-8"?>',
			'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
			...entries,
			"</sitemapindex>",
		].join("\n"),
		{
			headers: {
				"Content-Type": "application/xml; charset=utf-8",
				"Cache-Control": "public, max-age=3600",
			},
		},
	);
};
