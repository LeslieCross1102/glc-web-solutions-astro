/**
 * Maps EmDash pages to ports of the WordPress theme's page templates (page-*.php).
 * Each family owns its own matcher file so templates can be added independently.
 */
import type { GlcTemplate, TemplateMatcher } from "./types";
import { match as company } from "./company";
import { match as home } from "./home";
import { match as location } from "./location";
import { match as services } from "./services";
import { match as trades } from "./trades";

const matchers: TemplateMatcher[] = [home, services, trades, company, location];

export function resolveTemplate(page: { slug: string; title: string; path: string }): GlcTemplate | null {
	for (const matcher of matchers) {
		const template = matcher(page);
		if (template) return template;
	}
	return null;
}
