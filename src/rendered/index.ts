import manifest from "./manifest.json";
import descriptions from "../generated/descriptions.json";

export interface RenderedPage {
	key: string;
	kind: "page" | "post" | "archive";
	/** WordPress <title>, for archives rendered without a route of their own (author, page 2+) */
	title?: string;
	description?: string;
	bodyClass: string[];
	sections: boolean;
	trade: "electricians" | "pubs" | "landscapers" | null;
}

const pages = manifest as Record<string, RenderedPage>;

export function getRenderedPage(path: string): RenderedPage | null {
	return pages[trailingSlash(path)] ?? null;
}

export function trailingSlash(path: string): string {
	return path.endsWith("/") ? path : `${path}/`;
}

/** Self-referencing canonical in the WordPress trailing-slash form. */
export function canonicalUrl(url: URL, path: string): string {
	return new URL(trailingSlash(path), url.origin).href;
}

/** Meta description taken from a rendered page's opening paragraph, for pages without an SEO description. */
export function fallbackDescription(page: RenderedPage | null | undefined): string | null {
	return (page && (descriptions as Record<string, string>)[page.key]) || null;
}

// Static assets only change on deploy, which starts a fresh isolate.
const assetCache = new Map<string, Promise<string>>();

async function fetchAsset(pathname: string, requestUrl: URL): Promise<string> {
	const assetUrl = new URL(pathname, requestUrl.origin);
	let res: Response;
	try {
		const { env } = await import("cloudflare:workers");
		const assets = (env as { ASSETS?: Fetcher }).ASSETS;
		res = assets ? await assets.fetch(assetUrl) : await fetch(assetUrl);
	} catch {
		res = await fetch(assetUrl);
	}
	if (!res.ok) throw new Error(`Static asset ${pathname} missing (${res.status})`);
	return res.text();
}

function loadAsset(pathname: string, requestUrl: URL): Promise<string> {
	let pending = assetCache.get(pathname);
	if (!pending) {
		pending = fetchAsset(pathname, requestUrl);
		assetCache.set(pathname, pending);
		pending.catch(() => assetCache.delete(pathname));
	}
	return pending;
}

export async function loadRenderedHtml(page: RenderedPage, requestUrl: URL): Promise<string> {
	return (await loadAsset(`/glc/rendered/${page.key}.html`, requestUrl)).replaceAll("{{origin}}", requestUrl.origin);
}

/** Purged stylesheet for a rendered page, or the shared bundle for its layout combination. */
export function loadPageCss(
	requestUrl: URL,
	options: { key?: string | null; sections?: boolean; trade?: RenderedPage["trade"] | undefined },
): Promise<string> {
	if (options.key) return loadAsset(`/glc/rendered/${options.key}.css`, requestUrl);
	const combo = `${options.sections === false ? "plain" : "sections"}-${options.trade ?? "none"}`;
	return loadAsset(`/glc/build/css/${combo}.css`, requestUrl);
}
