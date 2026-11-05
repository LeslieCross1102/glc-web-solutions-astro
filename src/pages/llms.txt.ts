import type { APIRoute } from "astro";

import { businessAddressText } from "../data/glc/business";

/**
 * llms.txt (https://llmstxt.org) — a short map of the business for answer engines.
 * The address comes from the same object as the site-wide JSON-LD.
 */
export const GET: APIRoute = ({ site, url }) => {
	const origin = (site ?? new URL(url.origin)).origin;
	const page = (path: string, title: string, note: string) => `- [${title}](${origin}${path}): ${note}`;

	const body = `# GLC Web Solutions

> Website design and development, SEO and GEO, Google and Meta paid ads, and digital and AI consultancy for sole traders and small businesses across London and the South-East. Based in ${businessAddressText()}. Gareth Cross designs and builds every site. Website packages start at £445.

Consultations are by call, WhatsApp, email (gareth@glcwebsolutions.co.uk) or video. Phone 07958 793388. There is no office to visit and no outsourced production team.

## Services

${page("/website-design-and-development/", "Website design and development", "Bespoke sites for sole traders and small businesses. Packages from £445.")}
${page("/seo-and-geo-services/", "SEO and GEO", "Visibility on Google and in AI answers. Practical changes, walked through one to one.")}
${page("/digital-paid-marketing/", "Google and Meta paid ads", "Setup and management when a business needs enquiries faster.")}
${page("/digital-consultancy/", "Digital and AI consultancy", "One conversation and a clear next step, including practical AI.")}

## Company

${page("/", "Home", "What GLC Web Solutions does, with prices and common questions.")}
${page("/about/", "About", "Gareth Cross, director. He does the design, build, hosting and search himself.")}
${page("/contacts/", "Contact", "Email, phone, WhatsApp and the enquiry form. Free consultation.")}
${page("/costs/", "Costs", "Website package prices and what each one includes.")}
${page("/services/", "Services", "The four services and the local pages for Kent and South East London.")}
${page("/services/website-design-and-development-services-in-dartford/", "Dartford", "Local page for the town where the business is based.")}
${page("/all-posts/", "Blog", "Practical guides on websites, SEO, AI search and paid ads.")}
${page("/special-offer/", "Free website design", "A design within about 48 hours, with no obligation to continue.")}

## Optional

${page("/sitemap.xml", "Sitemap", "Every public page, post and category.")}
`;

	return new Response(body, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
