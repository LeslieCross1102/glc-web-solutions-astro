import { areasPlaces, contactUrl, offerUrl, ourWorkUrl } from "./shared";
import type { TradeData } from "./types";

export const landscapers: TradeData = {
	key: "landscapers",
	slugs: ["website-design-for-landscape-gardeners", "website-design-for-landscapers", "landscape-gardener-website-design"],
	bodyClass: ["glc-front", "glc-location", "glc-landscapers"],
	urlLabel: "verdantedge.co.uk",
	screens: ["home", "gallery", "estimator"],
	deviceClass: "glc-device--landscapers",
	whatsappMessage:
		"Hello, I would like website design, build and hosting for my landscape gardening business in London / the South-East.",
	hero: {
		eyebrow: "Website design for landscape gardeners · London & the South-East",
		titleLead: "Website design, build and hosting for landscape gardeners",
		titleAccent: "so you can stay on site — not in WordPress",
		lead: "Custom websites for landscape gardeners across London and the South-East: designed, built, hosted and SEO-tuned for consultations, project galleries and local search. One team looks after the lot.",
		primaryCta: { label: "Book a free consultation", url: contactUrl },
		secondaryCta: { label: "See website prices", url: "#glc-design-pricing" },
		showWhatsapp: true,
		character: { src: "/glc/assets/images/landscapers/gardener-character.png", width: 1230, height: 1070 },
	},
	fullService: {
		eyebrow: "Full service, not a template pack",
		title: "You run the gardens. We run the website.",
		lead: "Most landscape gardeners in London and the South-East do not need another DIY builder. They need a custom site that wins consultations, shows the work properly, and ranks for the searches that matter — without becoming a second job.",
		points: [
			"Custom design around how a landscaping business actually works: galleries, before-and-afters, estimators and consultation bookings.",
			"Website build with mobile-first layouts for homeowners searching “landscape gardener near me” on a phone in the garden.",
			"SEO written for landscaper searches in London, Kent, Surrey, Sussex, Essex and the wider South-East.",
			"Full hosting, backups, SSL and upkeep so the site stays fast while you are on site.",
		],
		screen: "estimator",
	},
	featuresIntro: {
		eyebrow: "Built for landscape gardeners",
		title: "Features that win garden projects — not generic brochure filler",
		lead: "Every landscaper website we design is custom: galleries, estimators and consultation CTAs so London and South-East clients can choose you in seconds.",
	},
	features: [
		{
			icon: "photo_library",
			title: "Galleries that sell the transformation",
			text: "Before-and-after journeys, not a dumped photo album — so a barren slope becomes the reason they book a consultation.",
		},
		{
			icon: "calculate",
			title: "Project estimators that qualify the brief",
			text: "Garden scale, planting density and materials up front — you see the size of the job before you pick up the phone.",
		},
		{
			icon: "event_available",
			title: "Consultation bookings that convert",
			text: "Clear “Book a consultation” paths for garden design, planting and maintenance — not a buried contact form.",
		},
		{
			icon: "yard",
			title: "Services that match how you actually work",
			text: "Hardscaping, planting, lighting and water features as distinct journeys — not a single dumped list of everything you do.",
		},
		{
			icon: "travel_explore",
			title: "Local SEO for London & the South-East",
			text: "Service-area copy, Google Business Profile alignment and on-page SEO for “landscape gardener near me” searches in your towns.",
		},
		{
			icon: "cloud_done",
			title: "Hosting you do not have to think about",
			text: "SSL, daily backups, updates and uptime monitoring included — the site stays online while you are laying stone or planting out.",
		},
	],
	showcaseIntro: {
		eyebrow: "How a landscape gardener website can look",
		title: "Custom design examples — not a theme we drop your logo on",
		lead: "Sharp, consultation-led layouts — not a template with your van livery dropped on. Your gardens, your process, your estimator; designed, built and hosted for London and the South-East.",
	},
	showcase: [
		{
			screen: "home",
			device: "laptop",
			layout: "feature",
			title: "Atmosphere, philosophy and a reason to book — on one homepage",
			caption:
				"A custom landscaper website that leads with the garden, then the process and a consultation — not a theme with your logo dropped on.",
		},
		{
			screen: "gallery",
			device: "laptop",
			layout: "half",
			title: "Transformations, not a Facebook dump",
			caption: "Before-and-after galleries with the story of the site — so the work sells itself before anyone emails.",
		},
		{
			screen: "estimator",
			device: "laptop",
			layout: "half",
			title: "An estimator that qualifies the job",
			caption: "Scale, planting and materials as tap targets — the brief is clearer before you visit the plot.",
		},
	],
	showcasePhones: [
		{ screen: "home", title: "Homepage", caption: "Thumb-sized CTAs for Explore gardens and Consultation." },
		{ screen: "gallery", title: "Transformations", caption: "Before-and-after cards a client can swipe on the sofa." },
		{ screen: "estimator", title: "Estimator on site", caption: "Garden scale and materials as tap targets." },
	],
	processIntro: {
		eyebrow: "How we work",
		title: "A clear process from brief to launch",
		lead: "Four focused stages keep the project moving — with transparency at every step so you always know what comes next, and can stay on the tools.",
	},
	pricingIntro: {
		eyebrow: "Website design costs for landscape gardeners",
		title: "Clear packages for design, build and hosting",
		lead: "The same website design packages we publish for every independent business — custom work for landscape gardeners in London and the South-East, with optional managed hosting so you never log in to “fix the site”.",
	},
	areas: {
		eyebrow: "London and the South-East",
		title: "Landscape gardener website design that targets the towns you actually cover",
		lead: "A pretty site that never names Kent, Surrey or south London will not rank for the gardens on your doorstep. We build coverage into the copy, the project pages and the technical SEO.",
		places: areasPlaces,
	},
	studiesIntro: {
		eyebrow: "Proof, not promises",
		title: "Case studies from local service businesses",
		lead: "We already build for independent local firms — sites that need galleries, trust and local search, the same brief a landscape gardener needs. Same process. Same full-service delivery.",
		linkLabel: "View all case studies",
		linkUrl: ourWorkUrl,
	},
	contact: {
		eyebrow: "Free website design offer",
		title: "Ready to get off the laptop and back on site?",
		lead: "Claim a free professionally designed website — new build or redesign — with a one-to-one consultation. Tell us about your landscaping business in London or the South-East and we will map design, build, hosting and SEO.",
		asideTitle: "What you get",
		asidePoints: [
			"FREE website design from your brief",
			"Or a redesign of the site you already have",
			"Custom build, SEO foundations and full hosting options",
			"Built for galleries, consultations and local search",
		],
		offerLabel: "Read the full offer",
		offerUrl,
		formLead:
			"Tell us about your landscaping business in London or the South-East and claim the free website design offer.",
	},
};
