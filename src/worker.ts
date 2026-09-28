import handler, { createScheduledHandler, PluginBridge } from "@emdash-cms/cloudflare/worker";

import manifest from "./rendered/manifest.json";

export { PluginBridge };

const EDGE = "Cloudflare-CDN-Cache-Control";
/** Statuses that may sit briefly at the edge; newly published content can't be tag-purged into them. */
const SHORT_EDGE_STATUSES = new Set([301, 308, 404, 410]);

/** Yoast sitemap paths submitted to Google Search Console, served from EmDash's per-collection sitemaps. */
const SITEMAP_ALIASES: Record<string, string> = {
	"/page-sitemap.xml": "/sitemap-pages.xml",
	"/post-sitemap.xml": "/sitemap-posts.xml",
};
/** EmDash entry that renders at "/". */
const HOME_SLUG = "home-1";
/**
 * WordPress permalink for each entry slug (e.g. /services/<slug>/), so sitemap URLs match the
 * canonicals Google already indexes. Entries created after the import fall back to /<slug>/.
 */
const WP_PATHS = new Map<string, string>([[HOME_SLUG, "/"]]);
for (const [path, page] of Object.entries(manifest)) {
	if (path !== "/" && (page.kind === "page" || page.kind === "post")) {
		WP_PATHS.set(path.split("/").filter(Boolean).pop()!, path);
	}
}
/** Entry URLs only; `<image:loc>` is left alone. */
const ENTRY_LOC = /<loc>(https?:\/\/[^/<]+)\/([^<]*?)\/?<\/loc>/g;

async function serveSitemapAlias(
	request: Request,
	target: string,
	env: unknown,
	ctx: ExecutionContext,
): Promise<Response> {
	const response = await handler.fetch!(new Request(new URL(target, request.url), request), env, ctx);
	if (!response.ok) return response;
	const xml = (await response.text()).replace(ENTRY_LOC, (_: string, origin: string, slug: string) => {
		const leaf = slug.split("/").pop() ?? "";
		return `<loc>${origin}${WP_PATHS.get(leaf) ?? `/${slug}/`}</loc>`;
	});
	const headers = new Headers(response.headers);
	headers.delete("Content-Length");
	return new Response(xml, { status: response.status, headers });
}

/**
 * Workers Cache stores responses without Cache-Control for up to 2 hours, so every
 * response leaves here with an explicit policy:
 * - pages that opted into the route cache keep their edge TTL (short for 404s/redirects);
 * - responses a route marked public (robots, sitemap, feed, media) cache per Cache-Control;
 * - everything else stays out of the shared cache.
 */
function withCachePolicy(response: Response): Response {
	const { status } = response;
	const cacheControl = response.headers.get("Cache-Control") ?? "";
	const edge = response.headers.get(EDGE);
	// The adapter marks responses without route-cache options "no-store" at the edge
	const routeCached = !!edge && !/no-store|private/i.test(edge);
	let nextEdge = edge;
	let nextCacheControl = cacheControl;

	if (/private|no-store/i.test(cacheControl)) {
		nextEdge = "no-store";
	} else if (routeCached) {
		if (status !== 200) nextEdge = SHORT_EDGE_STATUSES.has(status) ? "public, max-age=300" : "no-store";
		nextCacheControl ||= "public, max-age=0, must-revalidate";
	} else if (status === 200 && /\bpublic\b/i.test(cacheControl)) {
		nextEdge = null;
	} else {
		nextEdge = "no-store";
		nextCacheControl ||= "private, no-store";
	}
	if (nextEdge === edge && nextCacheControl === cacheControl) return response;

	const headers = new Headers(response.headers);
	if (nextEdge) headers.set(EDGE, nextEdge);
	else headers.delete(EDGE);
	headers.set("Cache-Control", nextCacheControl);
	return new Response(response.body, { status, statusText: response.statusText, headers });
}

export default {
	...handler,
	async fetch(request, env, ctx) {
		const { pathname } = new URL(request.url);
		if (pathname === "/sitemap_index.xml") {
			return withCachePolicy(Response.redirect(new URL("/sitemap.xml", request.url).href, 301));
		}
		const alias = SITEMAP_ALIASES[pathname];
		if (alias) return withCachePolicy(await serveSitemapAlias(request, alias, env, ctx));
		return withCachePolicy(await handler.fetch!(request, env, ctx));
	},
	scheduled: createScheduledHandler(),
} satisfies ExportedHandler;
