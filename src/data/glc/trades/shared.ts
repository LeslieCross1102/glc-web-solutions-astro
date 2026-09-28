export const whatsappNumber = "447958793388";
export const phoneHref = "tel:07958793388";
export const contactUrl = "/contacts/";
export const offerUrl = "/special-offer/";
export const ourWorkUrl = "/our-work/";
export const trustindexScore = "5.0";
export const offerFormId = "offer";

export function whatsappUrl(message: string): string {
	return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export interface ProcessStep {
	title: string;
	text: string;
	image: { src: string; width: number; height: number };
}

export const designProcess: ProcessStep[] = [
	{
		title: "Discover & brief",
		text: "We clarify goals, audience and content so the site plan matches your business — not a generic template.",
		image: { src: "/glc/uploads/2026/08/website-design-process-discover.png", width: 912, height: 558 },
	},
	{
		title: "Design & structure",
		text: "Wireframes and visual design establish hierarchy, brand and user journeys before a single page is built.",
		image: { src: "/glc/uploads/2026/08/website-design-process-design.png", width: 1010, height: 557 },
	},
	{
		title: "Build & refine",
		text: "Clean, responsive development with performance, accessibility and SEO foundations baked in from the start.",
		image: { src: "/glc/uploads/2026/08/website-design-process-build.png", width: 970, height: 529 },
	},
	{
		title: "Launch & support",
		text: "Go live with confidence — training, handover and optional hosting so your site stays fast and secure.",
		image: { src: "/glc/uploads/2026/08/website-design-process-launch.png", width: 921, height: 559 },
	},
];

export interface PortfolioItem {
	eyebrow: string;
	title: string;
	text: string;
	url: string;
	image: { src: string; width: number; height: number; alt: string };
}

export const portfolio: PortfolioItem[] = [
	{
		eyebrow: "Bespoke Staircases & Joinery",
		title: "Bliss Stairs Ltd",
		text: "A photography-led website for Kent staircase craftsmen — Get a Quote, WhatsApp, FAQs and a clear path to the Chatham workshop.",
		url: "/website-design-for-staircase-specialists/",
		image: {
			src: "/glc/uploads/2026/08/bliss-stairs-homepage-desktop.png",
			width: 1024,
			height: 588,
			alt: "Bliss Staircase Specialists homepage on a MacBook",
		},
	},
	{
		eyebrow: "Holiday Homes & Coastal Lets",
		title: "No. 1 Longshore",
		text: "A photography-led booking site for a Porth coastal retreat — Book Direct beside Airbnb, live availability and a guest book that sits on the property domain.",
		url: "/website-design-for-holiday-homes/",
		image: {
			src: "/glc/uploads/2026/08/no-1-longshore-homepage-desktop.png",
			width: 1024,
			height: 588,
			alt: "No. 1 Longshore holiday home website on a laptop",
		},
	},
	{
		eyebrow: "Personal Branding & Wellness",
		title: "Perspective Coaching",
		text: "Empowering digital presence for high-performance life coaching, featuring a streamlined booking workflow and empathetic UI architecture.",
		url: "/website-design-for-life-coaches/",
		image: {
			src: "/glc/uploads/2021/01/lifecoach-hypnotherapist-website-build-1024x754.png",
			width: 1024,
			height: 754,
			alt: "Perspective Coaching website build",
		},
	},
	{
		eyebrow: "Local Business Growth",
		title: "Waggz Dog Walking",
		text: "Scaling a local service provider through GEO-targeted SEO and a mobile-first responsive design that prioritises customer trust.",
		url: "/website-design-for-dog-walkers/",
		image: {
			src: "/glc/uploads/2026/08/waggz-dog-walking-website-design.png",
			width: 1024,
			height: 739,
			alt: "Waggz Dog Walking website build",
		},
	},
	{
		eyebrow: "Home Improvement",
		title: "My Retreat Garden Rooms",
		text: "A premium garden rooms showcase for Surrey homeowners — imagery-led design, local SEO foundations and clear quote journeys.",
		url: "/website-design-for-garden-rooms/",
		image: {
			src: "/glc/uploads/2026/08/my-retreat-garden-rooms-homepage-tablet.png",
			width: 1024,
			height: 739,
			alt: "My Retreat Garden Rooms homepage on a tablet",
		},
	},
	{
		eyebrow: "Local Trade Services",
		title: "Talis Heating Solutions",
		text: "A trust-first website for a Sunningdale plumber and gas engineer — mobile call paths, service clarity and local search foundations.",
		url: "/website-design-for-plumbers/",
		image: {
			src: "/glc/uploads/2026/08/talis-heating-solutions-website-design-1024x595.png",
			width: 1024,
			height: 595,
			alt: "Talis Heating Solutions website shown on laptop and smartphones",
		},
	},
];

export const areasPlaces = [
	"Greater London — inner and outer boroughs",
	"Kent — Dartford, Sevenoaks, Maidstone and the north Kent coast",
	"Surrey — Guildford, Woking, Reigate and the M25 towns",
	"Sussex — Brighton, Crawley, Eastbourne and the coast",
	"Essex — Romford, Chelmsford, Basildon and Thurrock",
	"Berkshire, Hampshire and the wider South-East corridor",
];
