import { areasPlaces, contactUrl, offerUrl, ourWorkUrl } from "./shared";
import type { TradeData } from "./types";

export const electricians: TradeData = {
	key: "electricians",
	slugs: ["website-design-for-electricians", "electrician-website-design", "website-design-for-electricians-london"],
	bodyClass: ["glc-front", "glc-location", "glc-electricians"],
	urlLabel: "voltmaster.uk",
	screens: ["home", "emergency", "quote"],
	deviceClass: "",
	whatsappMessage:
		"Hello, I would like website design, build and hosting for my electrical business in London / the South-East.",
	hero: {
		eyebrow: "Website design for electricians · London & the South-East",
		titleLead: "Website design, build and hosting for electricians",
		titleAccent: "so you can stay on the tools — not in WordPress",
		lead: "Custom websites for NICEIC electricians across London and the South-East: designed, built, hosted and SEO-tuned for call-outs, quotes and local search. One team looks after the lot.",
		primaryCta: { label: "Book a free consultation", url: contactUrl },
		secondaryCta: { label: "See website prices", url: "#glc-design-pricing" },
		showWhatsapp: true,
		character: { src: "/glc/assets/images/electricians/electrician-character.png", width: 293, height: 553 },
	},
	fullService: {
		eyebrow: "Full service, not a template pack",
		title: "You run the electrical work. We run the website.",
		lead: "Most electricians in London and the South-East do not need another DIY builder. They need a custom site that wins jobs, stays live, and ranks for the searches that matter — without becoming a second job.",
		points: [
			"Custom design around how you actually work: emergencies, planned jobs, domestic, commercial and industrial.",
			"Website build with tap-to-call, quote flows and mobile-first layouts for homeowners searching at 11pm.",
			"SEO written for electrician searches in London, Kent, Surrey, Sussex, Essex and the wider South-East.",
			"Full hosting, backups, SSL and upkeep so the site stays fast while you are on site.",
		],
		screen: "emergency",
	},
	featuresIntro: {
		eyebrow: "Built for electricians",
		title: "Features that win electrical work — not generic brochure filler",
		lead: "Every electrician website we design is custom: emergency CTAs, quote journeys and trust signals so London and South-East customers can book you in seconds.",
	},
	features: [
		{
			icon: "call",
			title: "Emergency call paths",
			text: "Sticky “Call now” and 24/7 dispatch buttons so urgent searches on a phone become a job, not a bounce.",
		},
		{
			icon: "request_quote",
			title: "Quote forms that qualify the job",
			text: "Multi-step requests for EV chargers, consumer units, EICR and fault finding — so you see the work before you ring back.",
		},
		{
			icon: "verified_user",
			title: "NICEIC and trust badges",
			text: "Part P, TrustMark, CHAS and insurance cues placed where homeowners need reassurance before inviting you in.",
		},
		{
			icon: "home",
			title: "Domestic, commercial, industrial",
			text: "Clear service cards for rewires, EICR, three-phase and plant — not a single dumped list of everything you do.",
		},
		{
			icon: "travel_explore",
			title: "Local SEO for London & the South-East",
			text: "Service-area pages, Google Business Profile alignment and on-page copy for “electrician near me” searches in your towns.",
		},
		{
			icon: "cloud_done",
			title: "Hosting you do not have to think about",
			text: "SSL, daily backups, updates and uptime monitoring included — the site stays online while you are in a loft or a switch room.",
		},
	],
	showcaseIntro: {
		eyebrow: "How an electrician website can look",
		title: "Custom design examples — not a theme we drop your logo on",
		lead: "Sharp, conversion-led layouts — not a theme with your logo dropped on. Your brand, your areas, your services; designed, built and hosted for London and the South-East.",
	},
	showcase: [
		{
			screen: "home",
			device: "laptop",
			layout: "feature",
			title: "Domestic, commercial and emergency — on one homepage",
			caption:
				"A custom electrician website that splits planned work from 24/7 repairs, with NICEIC-style accreditation in the first screen.",
		},
		{
			screen: "emergency",
			device: "laptop",
			layout: "half",
			title: "Emergency-first layout",
			caption:
				"When the search is “sparking socket” or “power cut”, the page leads with a tap-to-call number — not a contact form.",
		},
		{
			screen: "quote",
			device: "laptop",
			layout: "half",
			title: "Quote builder, not a blank email box",
			caption:
				"Service type, postcode, time window and contact details — the job is qualified before you pick up the phone.",
		},
	],
	showcasePhones: [
		{ screen: "home", title: "Homepage", caption: "Thumb-sized CTAs for Book a service and Call emergency." },
		{ screen: "emergency", title: "24/7 dispatch", caption: "Fault cards and a number that is impossible to miss." },
		{ screen: "quote", title: "Quote on the sofa", caption: "EV, consumer units and fault finding as tap targets." },
	],
	processIntro: {
		eyebrow: "How we work",
		title: "A clear process from brief to launch",
		lead: "Four focused stages keep the project moving — with transparency at every step so you always know what comes next, and can stay on the tools.",
	},
	pricingIntro: {
		eyebrow: "Website design costs for electricians",
		title: "Clear packages for design, build and hosting",
		lead: "The same website design packages we publish for every trade — custom work for electricians in London and the South-East, with optional managed hosting so you never log in to “fix the site”.",
	},
	areas: {
		eyebrow: "London and the South-East",
		title: "Electrician website design that targets the towns you actually cover",
		lead: "A pretty site that never names Kent, Surrey or south London will not rank for the work on your doorstep. We build coverage into the copy, the service pages and the technical SEO.",
		places: areasPlaces,
	},
	studiesIntro: {
		eyebrow: "Proof, not promises",
		title: "Case studies from local service businesses",
		lead: "We already build for trades and local firms — including Talis Heating Solutions, a Gas Safe engineer site with the same emergency, trust and local-search brief an electrician needs. Same process. Same full-service delivery.",
		linkLabel: "View all case studies",
		linkUrl: ourWorkUrl,
	},
	contact: {
		eyebrow: "Free website design offer",
		title: "Ready to get off the laptop and back on the tools?",
		lead: "Claim a free professionally designed website — new build or redesign — with a one-to-one consultation. Tell us about your electrical business in London or the South-East and we will map design, build, hosting and SEO.",
		asideTitle: "What you get",
		asidePoints: [
			"FREE website design from your brief",
			"Or a redesign of the site you already have",
			"Custom build, SEO foundations and full hosting options",
			"Built for NICEIC trust, call-outs and local search",
		],
		offerLabel: "Read the full offer",
		offerUrl,
		formLead:
			"Tell us about your electrical business in London or the South-East and claim the free website design offer.",
	},
};
