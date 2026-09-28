import type { AstroComponentFactory } from "astro/runtime/server/index.js";

/** Props every GLC page template receives */
export interface TemplateProps {
	/** EmDash page slug (WordPress post_name) */
	slug: string;
	/** EmDash page title */
	title: string;
	/** Original request path, e.g. /services/website-design-and-development-services-in-dartford/ */
	path: string;
}

export interface GlcTemplate {
	component: AstroComponentFactory;
	/** glc-* body classes the live WordPress page carries (the CSS keys off some of them) */
	bodyClass?: string[];
	trade?: "electricians" | "pubs" | "landscapers";
	/** Use this template instead of the page body rendered from WordPress (set once the port is verified). */
	replaceRendered?: boolean;
}

/** Returns the template for a page, or null when this family doesn't own it */
export type TemplateMatcher = (page: { slug: string; title: string; path: string }) => GlcTemplate | null;
