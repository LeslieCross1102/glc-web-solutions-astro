import type { CacheProviderFactory } from "astro";
import cloudflareProvider from "@astrojs/cloudflare/cache/provider";

/**
 * Workers Cache route provider. A failed purge is logged rather than thrown so
 * CMS saves still succeed; the page then refreshes when its edge TTL expires.
 */
const factory: CacheProviderFactory = (config) => {
	const provider = cloudflareProvider(config);
	return {
		...provider,
		async invalidate(options) {
			try {
				await provider.invalidate(options);
			} catch (error) {
				console.error("[cache] purge failed", error);
			}
		},
	};
};

export default factory;
