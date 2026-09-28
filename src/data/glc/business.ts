import locationGroups from "../../generated/footer-locations.json";
import { trailingSlash } from "../../rendered";

/** Services offered on every location page, with the page that describes each one. */
const SERVICES = [
	{ key: "website-design", name: "Website design and development", url: "/website-design-and-development/" },
	{ key: "seo-geo", name: "SEO and GEO (generative engine optimisation)", url: "/seo-and-geo-services/" },
	{ key: "paid-marketing", name: "Google and Meta paid ads management", url: "/digital-paid-marketing/" },
	{ key: "consultancy", name: "Digital and AI consultancy", url: "/digital-consultancy/" },
];

const hubs = locationGroups.filter((group) => group.url);
const hubUrls = new Set(hubs.map((hub) => hub.url));

/** Town pages without their own service markup (hub pages ship theirs in the rendered HTML), keyed by path. */
const towns = new Map<string, { town: string; hub: string | null }>();
for (const group of locationGroups) {
	for (const item of group.items) {
		if (!hubUrls.has(item.url)) towns.set(item.url, { town: item.label, hub: group.url ? group.name : null });
	}
}

const city = (name: string) => ({ "@type": "City", name });

/**
 * The business as one entity. The @id matches the provider/publisher references in the
 * rendered WordPress markup, so every page's services resolve to it.
 */
function organization(origin: string) {
	return {
		"@type": "ProfessionalService",
		"@id": `${origin}/#organization`,
		name: "GLC Web Solutions",
		url: `${origin}/`,
		logo: { "@type": "ImageObject", url: `${origin}/glc/uploads/2020/10/glc-web-solutions-logo-2020-medium.png`, width: 800, height: 147 },
		image: `${origin}/glc/uploads/2020/10/glc-web-solutions-logo-2020-medium.png`,
		description:
			"Website design and development, SEO and GEO, Google and Meta paid ads management, and digital and AI consultancy for small businesses in Kent and South East London.",
		telephone: "+447958793388",
		email: "gareth@glcwebsolutions.co.uk",
		founder: {
			"@type": "Person",
			name: "Gareth Cross",
			jobTitle: "Director",
			url: `${origin}/about/`,
			sameAs: ["https://www.linkedin.com/in/garethlcross/"],
		},
		sameAs: ["https://www.facebook.com/glcwebsolutions"],
		areaServed: [
			...hubs.map((hub) => city(hub.name)),
			{ "@type": "AdministrativeArea", name: "Kent" },
			{ "@type": "AdministrativeArea", name: "London" },
		],
		knowsAbout: [
			"Website design",
			"Website development",
			"WordPress",
			"Search engine optimisation (SEO)",
			"Generative engine optimisation (GEO)",
			"Local SEO",
			"Google Ads",
			"Meta Ads",
			"Digital marketing",
			"AI consultancy",
		],
		openingHoursSpecification: {
			"@type": "OpeningHoursSpecification",
			dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			opens: "08:00",
			closes: "21:00",
		},
		hasOfferCatalog: {
			"@type": "OfferCatalog",
			name: "Digital services",
			itemListElement: SERVICES.map((service) => ({
				"@type": "Offer",
				itemOffered: { "@type": "Service", name: service.name, url: `${origin}${service.url}` },
			})),
		},
	};
}

function townServices(origin: string, path: string) {
	const page = towns.get(trailingSlash(path));
	if (!page) return [];
	const pageUrl = `${origin}${trailingSlash(path)}`;
	const areaServed = [city(page.town), ...(page.hub ? [city(page.hub)] : [])];
	return SERVICES.map((service) => ({
		"@type": "Service",
		"@id": `${pageUrl}#${service.key}`,
		name: `${service.name} in ${page.town}`,
		serviceType: service.name,
		url: `${origin}${service.url}`,
		provider: { "@id": `${origin}/#organization` },
		areaServed,
	}));
}

/** JSON-LD graph for every page: the business, plus the four services on town pages. */
export function businessJsonLd(origin: string, path: string) {
	return { "@context": "https://schema.org", "@graph": [organization(origin), ...townServices(origin, path)] };
}
