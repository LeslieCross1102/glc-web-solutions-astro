import { areasPlaces, contactUrl, offerUrl, ourWorkUrl } from "./shared";
import type { TradeData } from "./types";

export const pubs: TradeData = {
	key: "pubs",
	slugs: ["website-design-for-pubs", "pub-website-design", "website-design-for-pubs-london"],
	bodyClass: ["glc-front", "glc-location", "glc-pubs"],
	urlLabel: "thelocaltavern.co.uk",
	screens: ["home", "events", "menu"],
	deviceClass: "glc-device--pubs",
	whatsappMessage: "Hello, I would like website design, build and hosting for my pub in London / the South-East.",
	hero: {
		eyebrow: "Website design for pubs · London & the South-East",
		titleLead: "Website design, build and hosting for pubs",
		titleAccent: "so you can stay behind the bar — not in WordPress",
		lead: "Custom websites for pubs, taverns and gastropubs across London and the South-East: designed, built, hosted and SEO-tuned for table bookings, menus, events and local search. One team looks after the lot.",
		primaryCta: { label: "Book a free consultation", url: contactUrl },
		secondaryCta: { label: "See website prices", url: "#glc-design-pricing" },
		showWhatsapp: true,
		character: { src: "/glc/assets/images/pubs/pub-character.png", width: 570, height: 1076 },
	},
	fullService: {
		eyebrow: "Full service, not a template pack",
		title: "You run the pub. We run the website.",
		lead: "Most publicans in London and the South-East do not need another DIY builder. They need a custom site that fills tables, promotes what’s on, and ranks for the searches that matter — without becoming a second job.",
		points: [
			"Custom design around how a pub actually works: menus, table bookings, quizzes, function rooms and Sunday roast.",
			"Website build with book-a-table, tap-to-call and mobile-first layouts for guests searching “pub near me” on the way home.",
			"SEO written for pub searches in London, Kent, Surrey, Sussex, Essex and the wider South-East.",
			"Full hosting, backups, SSL and upkeep so the site stays fast while you are pulling pints.",
		],
		screen: "events",
	},
	featuresIntro: {
		eyebrow: "Built for pubs",
		title: "Features that fill tables — not generic brochure filler",
		lead: "Every pub website we design is custom: booking CTAs, menus, events and trust signals so London and South-East guests can choose you in seconds.",
	},
	features: [
		{
			icon: "event_available",
			title: "Table bookings that convert",
			text: "Clear “Book a table” paths — not a buried contact form — so Friday-night searches on a phone become covers, not bounces.",
		},
		{
			icon: "restaurant_menu",
			title: "Menus guests can actually use",
			text: "Food, cask, craft and Sunday roast laid out so prices, allergens and specials are obvious before anyone walks through the door.",
		},
		{
			icon: "celebration",
			title: "What’s on, week in week out",
			text: "Quiz nights, darts, live sessions and seasonal events with dates, times and a way to book a table or the function room.",
		},
		{
			icon: "meeting_room",
			title: "Function rooms and private hire",
			text: "Capacity, catering and enquiry forms for wakes, birthdays and office dos — so The Oak Room is not competing with a generic “contact us”.",
		},
		{
			icon: "travel_explore",
			title: "Local SEO for London & the South-East",
			text: "Service-area copy, Google Business Profile alignment and on-page SEO for “pub near me”, Sunday roast and function-hire searches in your towns.",
		},
		{
			icon: "cloud_done",
			title: "Hosting you do not have to think about",
			text: "SSL, daily backups, updates and uptime monitoring included — the site stays online while you are behind the bar or in the cellar.",
		},
	],
	showcaseIntro: {
		eyebrow: "How a pub website can look",
		title: "Custom design examples — not a theme we drop your logo on",
		lead: "Sharp, booking-led layouts — not a template with your pint glass dropped on. Your brand, your rooms, your weekly traditions; designed, built and hosted for London and the South-East.",
	},
	showcase: [
		{
			screen: "home",
			device: "laptop",
			layout: "feature",
			title: "Heritage, hearth and a reason to book — on one homepage",
			caption:
				"A custom pub website that leads with atmosphere, then menus, what’s on and a function room — not a theme with your logo dropped on.",
		},
		{
			screen: "events",
			device: "laptop",
			layout: "half",
			title: "Events and private hire, not a Facebook dump",
			caption:
				"Quiz nights, darts and The Oak Room with an enquiry form — so function hire is a journey, not an email address in the footer.",
		},
		{
			screen: "menu",
			device: "laptop",
			layout: "half",
			title: "Menus that look as considered as the kitchen",
			caption: "Classics, craft and cask with prices a guest can scan on a phone before they leave the office.",
		},
	],
	showcasePhones: [
		{ screen: "home", title: "Homepage", caption: "Thumb-sized CTAs for View menu and Book a table." },
		{
			screen: "events",
			title: "Events & functions",
			caption: "Weekly traditions and a hire enquiry that is impossible to miss.",
		},
		{ screen: "menu", title: "Menu on the sofa", caption: "Kitchen, craft and Sunday roast as tap targets." },
	],
	processIntro: {
		eyebrow: "How we work",
		title: "A clear process from brief to launch",
		lead: "Four focused stages keep the project moving — with transparency at every step so you always know what comes next, and can stay on the pumps.",
	},
	pricingIntro: {
		eyebrow: "Website design costs for pubs",
		title: "Clear packages for design, build and hosting",
		lead: "The same website design packages we publish for every independent business — custom work for pubs in London and the South-East, with optional managed hosting so you never log in to “fix the site”.",
	},
	areas: {
		eyebrow: "London and the South-East",
		title: "Pub website design that targets the towns you actually serve",
		lead: "A pretty site that never names Kent, Surrey or south London will not rank for the regulars on your doorstep. We build coverage into the copy, the events pages and the technical SEO.",
		places: areasPlaces,
	},
	studiesIntro: {
		eyebrow: "Proof, not promises",
		title: "Case studies from local service businesses",
		lead: "We already build for independent local firms — sites that need bookings, trust and local search, the same brief a pub needs. Same process. Same full-service delivery.",
		linkLabel: "View all case studies",
		linkUrl: ourWorkUrl,
	},
	contact: {
		eyebrow: "Free website design offer",
		title: "Ready to get off the laptop and back behind the bar?",
		lead: "Claim a free professionally designed website — new build or redesign — with a one-to-one consultation. Tell us about your pub in London or the South-East and we will map design, build, hosting and SEO.",
		asideTitle: "What you get",
		asidePoints: [
			"FREE website design from your brief",
			"Or a redesign of the site you already have",
			"Custom build, SEO foundations and full hosting options",
			"Built for bookings, menus, events and local search",
		],
		offerLabel: "Read the full offer",
		offerUrl,
		formLead: "Tell us about your pub in London or the South-East and claim the free website design offer.",
	},
};
