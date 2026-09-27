/**
 * Public content URLs mirror WordPress root permalinks (not /posts/ or /pages/).
 * Nested WP paths like /services/foo resolve via catch-all last-segment fallback;
 * generated links use the stored slug (usually the leaf post_name).
 */
export function contentUrl(slug: string | null | undefined): string {
	if (!slug) return "/";
	const cleaned = String(slug).replace(/^\/+|\/+$/g, "");
	return cleaned ? `/${cleaned}` : "/";
}

/** Candidate slugs to try when resolving a request path against EmDash entries. */
export function slugLookupCandidates(pathSlug: string): string[] {
	const cleaned = pathSlug.replace(/^\/+|\/+$/g, "");
	if (!cleaned) return [];
	const candidates = [cleaned];
	const parts = cleaned.split("/").filter(Boolean);
	if (parts.length > 1) {
		candidates.push(parts[parts.length - 1]!);
	}
	return candidates;
}
