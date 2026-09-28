import { electricians } from "../data/glc/trades/electricians";
import { landscapers } from "../data/glc/trades/landscapers";
import { pubs } from "../data/glc/trades/pubs";
import Electricians from "./trades/Electricians.astro";
import Landscapers from "./trades/Landscapers.astro";
import Pubs from "./trades/Pubs.astro";
import type { TemplateMatcher } from "./types";

/** Mirrors glc_is_custom_{electricians,pubs,landscapers}_page(): exact post_name match against each trade's slug list */
export const match: TemplateMatcher = ({ slug }) => {
	if (electricians.slugs.includes(slug)) {
		return { component: Electricians, bodyClass: electricians.bodyClass, trade: "electricians" };
	}
	if (pubs.slugs.includes(slug)) {
		return { component: Pubs, bodyClass: pubs.bodyClass, trade: "pubs" };
	}
	if (landscapers.slugs.includes(slug)) {
		return { component: Landscapers, bodyClass: landscapers.bodyClass, trade: "landscapers" };
	}
	return null;
};
