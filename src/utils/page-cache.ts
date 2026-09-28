import type { AstroGlobal } from "astro";

/** EmDash chrome tags for what Base.astro renders (site settings, primary menu), so admin saves purge every page. */
const CHROME_TAGS = ["emdash:settings", "emdash:menu:primary"];

/**
 * Opt a public page into the Workers edge cache. Call from page frontmatter after
 * any content cache hints: route-cache headers are applied before layouts render.
 * Logged-in visitors are opted out so their responses never reach the shared cache.
 */
export function cachePublicPage(astro: AstroGlobal): void {
	if (!astro.cache?.enabled) return;
	if (astro.locals.user) {
		astro.cache.set(false);
		return;
	}
	// Content saves purge by tag; the TTL only bounds staleness for untagged changes
	astro.cache.set({ maxAge: 3600, swr: 86400, tags: CHROME_TAGS });
}
