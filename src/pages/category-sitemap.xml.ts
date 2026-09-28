import type { APIRoute } from "astro";
import { getTaxonomyTerms } from "emdash";

type Term = Awaited<ReturnType<typeof getTaxonomyTerms>>[number];

function flatten(terms: Term[]): Term[] {
	return terms.flatMap((term) => [term, ...flatten(term.children ?? [])]);
}

/** Category archives that have posts, at the Yoast path submitted to Google Search Console. */
export const GET: APIRoute = async ({ site, url }) => {
	const base = site ?? new URL(url.origin);
	const slugs = new Set(
		flatten(await getTaxonomyTerms("category"))
			.filter((term) => (term.count ?? 0) > 0)
			.map((term) => term.slug),
	);
	const entries = [...slugs]
		.sort()
		.map(
			(slug) =>
				`  <url>\n    <loc>${new URL(`/category/${encodeURIComponent(slug)}/`, base).href}</loc>\n  </url>`,
		);

	return new Response(
		[
			'<?xml version="1.0" encoding="UTF-8"?>',
			'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
			...entries,
			"</urlset>",
		].join("\n"),
		{
			headers: {
				"Content-Type": "application/xml; charset=utf-8",
				"Cache-Control": "public, max-age=3600",
			},
		},
	);
};
