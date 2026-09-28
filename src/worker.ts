import handler, { createScheduledHandler, PluginBridge } from "@emdash-cms/cloudflare/worker";

export { PluginBridge };

const EDGE = "Cloudflare-CDN-Cache-Control";
/** Statuses that may sit briefly at the edge; newly published content can't be tag-purged into them. */
const SHORT_EDGE_STATUSES = new Set([301, 308, 404, 410]);

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
		return withCachePolicy(await handler.fetch!(request, env, ctx));
	},
	scheduled: createScheduledHandler(),
} satisfies ExportedHandler;
