import { trailingSlash } from "../../rendered";

/**
 * Meta descriptions for listing pages (blog, category, tag and author archives), keyed by first-page path.
 * Archives have no editable SEO of their own; the blog page (/all-posts/) uses its CMS SEO panel instead.
 */
const LISTING_DESCRIPTIONS: Record<string, string> = {
	"/author/gareth-cross/":
		"Articles by Gareth Cross, founder of GLC Web Solutions, on website design, SEO, AI search, paid ads and WordPress for small businesses.",
	"/category/digital-ads/":
		"Guides to Google Ads, ChatGPT ads, social media and digital media buying, and what platform changes mean for small business advertisers.",
	"/category/geo/":
		"Generative engine optimisation (GEO): how Google updates, AI shopping agents and AI assistants change the way customers find your business.",
	"/category/marketing/":
		"Digital marketing guides for small businesses, from UK media buying to Google Workspace and the technology changes worth planning for.",
	"/category/ppc/":
		"Pay-per-click advice for UK small businesses: Google Ads and AI Max, ChatGPT ads, and where to spend your digital media budget.",
	"/category/seo/":
		"SEO news and guides for small businesses: Google core and spam updates, Search Console, AI search and changes that affect your traffic.",
	"/category/uncategorized/":
		"Browser and technology news from the GLC Web Solutions blog, including AI browsers and Chrome’s faster release cycle.",
	"/category/wordpress/":
		"WordPress security guides: the best security plugins, keeping your site updated and the releases small business owners shouldn’t ignore.",
	"/tag/ai-news/":
		"AI news for small businesses: ChatGPT advertising, AI watermarking and what the latest AI changes mean for your website and marketing.",
	"/tag/plugins/":
		"WordPress plugin recommendations from GLC Web Solutions, with a focus on keeping small business websites secure.",
	"/tag/security/":
		"Website security advice for WordPress sites, including the security plugins we recommend for small businesses.",
	"/tag/wordpress/":
		"WordPress guides from GLC Web Solutions, covering plugins and security for small business websites.",
};

/**
 * Share images for pages whose WordPress og:image never reached EmDash SEO. Used only when the entry
 * has no SEO image of its own. Three WordPress og:images pointed at missing .jpg files, so these use
 * the matching uploads that exist.
 */
const SHARE_IMAGES: Record<string, string> = {
	"/": "/_emdash/api/media/file/01M3J6T9SED6PRQ53RNGFHD6T1.png",
	"/our-work/": "/glc/uploads/2026/08/waggz-dog-walking-website-design.png",
	"/website-design-for-dog-walkers/": "/glc/uploads/2026/08/waggz-dog-walking-website-design.png",
	"/website-design-for-holiday-homes/": "/glc/uploads/2026/08/no-1-longshore-homepage-desktop.png",
	"/website-design-for-life-coaches/": "/glc/uploads/2021/01/lifecoach-hypnotherapist-website-build-1024x754.png",
	"/services/website-design-for-electricians/": "/glc/assets/images/electricians/electrician-website-hero-desktop.jpg",
	"/services/website-design-for-landscape-gardeners/": "/glc/assets/images/landscapers/garden-photo-dusk.jpg",
	"/services/website-design-for-pubs/": "/glc/assets/images/pubs/pub-website-home.jpg",
};

const PAGED = /^(.*\/)page\/(\d+)\/$/;

/** Description for a listing page; later pages reuse the first page's text with their page number. */
export function listingDescription(path: string, pageLabel?: string | null): string | null {
	const paged = trailingSlash(path).match(PAGED);
	const text = LISTING_DESCRIPTIONS[paged ? paged[1]! : trailingSlash(path)];
	if (!text) return null;
	return paged ? `${text} ${pageLabel ?? `Page ${paged[2]}`}.` : text;
}

export function shareImage(path: string, origin: string): string | null {
	const image = SHARE_IMAGES[trailingSlash(path)];
	return image ? new URL(image, origin).href : null;
}
