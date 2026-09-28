export interface FaqItem {
	q: string;
	a: string;
}

export interface FaqSection {
	section_id: string;
	eyebrow: string;
	title: string;
	intro: string;
	items: FaqItem[];
}

/** `{{place}}` is replaced with the town name on location pages. */
export const faqSections: Record<string, FaqSection> = {
	"home": {
		"section_id": "glc-faq",
		"eyebrow": "Questions people ask",
		"title": "Website, search and ads — answered",
		"intro": "What it costs, who does the work, and how quickly a site can go live. No sales waffle.",
		"items": [
			{
				"q": "How much does a website from GLC Web Solutions cost?",
				"a": "Website builds start at £795 for Professional Basic (up to 5 pages). Enterprise Plus is £1,495 and Commerce Enterprise is £3,495 for shops, diaries and quote tools. Every package includes daily backups, a test server, Google Search Console and Google Analytics. SEO and consultancy are quoted after a free consultation."
			},
			{
				"q": "Do you only build websites, or can you help with SEO and ads as well?",
				"a": "The website comes first. Around it you can add SEO & GEO so people find you on Google and in AI answers, paid ads on Google and Meta when you need enquiries faster, and one-to-one consultancy when you need a decision rather than a strategy deck. You do not have to buy everything together."
			},
			{
				"q": "How quickly can a new website go live?",
				"a": "On the special offer, a professional design comes back in about 48 hours and the finished site can be live within seven days — listed on Google and Bing, with Analytics and daily backups. Standard builds follow a four-stage process: brief, design, build, then launch and support."
			},
			{
				"q": "Who actually designs and builds the site?",
				"a": "Gareth Cross — not a junior, not an offshore studio. There is no outsourced production team. Design, build, hosting and search sit with one person, which is why the prices stay cost-effective and the advice stays straight."
			},
			{
				"q": "Do I have to manage hosting and updates myself?",
				"a": "No. Hosting, SSL, backups and updates can sit with us so you stay on the tools. There is also a full managed website service — £300 to start, then £100 a month on a 24-month minimum — with bi-weekly calls to review data and performance."
			},
			{
				"q": "Where are you based, and who is this for?",
				"a": "GLC Web Solutions is based in Dartford and works with sole traders and small businesses across London and the South-East — trades, pubs, holiday lets, coaches and local services. A free consultation is the starting point, by call, WhatsApp or the contact form."
			}
		]
	},
	"about": {
		"section_id": "glc-faq",
		"eyebrow": "Working with Gareth",
		"title": "Who you hire, and how the work gets done",
		"intro": "One person designs, builds and looks after the site. Here is what that actually means.",
		"items": [
			{
				"q": "Who will I actually work with at GLC Web Solutions?",
				"a": "You work with Gareth Cross. There is no account manager who never opens the files, no junior bench and no hidden production team. Brief, design, build, hosting and search are his own work."
			},
			{
				"q": "Do you outsource website development?",
				"a": "No. Sites are not subcontracted and there is no white-label agency in another country. If it is on your site, Gareth put it there."
			},
			{
				"q": "How does the Telegraph role help a small-business website?",
				"a": "Gareth is Senior Director, Digital Solutions at The Telegraph — commercial digital product, advertising operations and strategy across the website, apps and platforms. That means regular contact with Google, Meta, Amazon, Microsoft, Adobe and the agencies that serve large advertisers. The same tools and judgement then get used for local businesses, without a Soho-agency price."
			},
			{
				"q": "Where is GLC Web Solutions based?",
				"a": "Dartford, United Kingdom. Work is one-to-one by call, WhatsApp, email or video consultation, with clients across London and the South-East."
			},
			{
				"q": "Can I still get senior-level work at a small-business price?",
				"a": "That is the point of the practice. You are not paying for a large office or a bench of juniors. Website packages start at £795, with a free consultation before anything is committed."
			}
		]
	},
	"offer": {
		"section_id": "glc-faq",
		"eyebrow": "The special offer",
		"title": "Free design, seven-day build — answered",
		"intro": "How the risk-free design works, what £795 includes, and what happens if you are not happy.",
		"items": [
			{
				"q": "Is the website design really free?",
				"a": "Yes. You see a professional design first, shaped around a short brief. You are under no obligation to pay anything if you are not happy with it. You only pay if you approve the design and commission the build."
			},
			{
				"q": "What happens if I do not like the design?",
				"a": "You pay nothing. There is no obligation to proceed. If you want tweaks, there is a further day to mark them up before the build starts so the live site matches what you signed off."
			},
			{
				"q": "How does the seven-day website work?",
				"a": "Share a brief plus whatever you already have — logo, photos, the core facts. A design comes back in about 48 hours. After revisions, the finished site is delivered within another 48 hours: listed on Google and Bing, with Google Analytics, professional hosting and daily backups."
			},
			{
				"q": "What does the £795 build include?",
				"a": "£795 is the Professional Basic package if you go ahead: up to 5 pages, mobile-responsive design, contact form, basic on-page SEO, SSL, daily backups, a test server, Search Console, Analytics, one round of revisions, and launch training. Larger builds are Enterprise Plus at £1,495 and Commerce Enterprise at £3,495."
			},
			{
				"q": "Can you redesign my existing site as well as start from scratch?",
				"a": "Yes. The offer covers a brand-new site from a brief, or a redesign that keeps what already works and elevates the rest — clearer structure, sharper visuals, a modern experience without a blank page."
			},
			{
				"q": "Is there a consultation before design work starts?",
				"a": "Yes. You talk through objectives with Gareth first so the plan matches the business, not a generic template — what success looks like, which pages matter, and a practical path to deliver it."
			}
		]
	},
	"costs": {
		"section_id": "glc-faq",
		"eyebrow": "Pricing questions",
		"title": "What it costs, and what you get",
		"intro": "Website packages, ads, managed service, and why SEO and consultancy are quoted after a conversation.",
		"items": [
			{
				"q": "How much does a website cost?",
				"a": "Professional Basic is £795 (up to 5 pages). Enterprise Plus is £1,495 (up to 10 pages, custom design system, tracking). Commerce Enterprise is £3,495 (up to 20 pages, booking, quote or commerce tools, integrations). All three are one-off builds."
			},
			{
				"q": "What is included in every website package?",
				"a": "Daily website backup, a fully accessible test server, Controlled Vibe Coding access (Claude, ChatGPT, Cursor), Google Search Console and Google Analytics. Higher tiers add a custom data layer and Google Tag Manager."
			},
			{
				"q": "How much is the managed website service?",
				"a": "£300 upfront, then £100 per month on a 24-month minimum. It covers looking after the live site plus bi-weekly calls to review data and performance, so you can stay focused on the business."
			},
			{
				"q": "How much do Google Ads and Meta Ads cost?",
				"a": "Setup and launch across Google Ads and Meta Ads is £550 one-off. Maintain and monitor is £150 per month. Fully multi-landing page build and optimisation is £500 per month. Commit annually to Maintain and the setup fee is waived. Ad spend itself sits on top, in your own accounts."
			},
			{
				"q": "Why are SEO and consultancy quoted instead of listed as a price?",
				"a": "Audits and follow-on optimisation depend on the site, the competition and the opportunity. Consultancy is sized to the decision you need, not a menu of retainers. Both are priced after a free consultation — not a one-size list."
			},
			{
				"q": "Are there hidden costs after I go live?",
				"a": "No hidden fees on the published packages. Optional extras — managed service, ongoing SEO, paid ads — are listed separately so you can add them only where they save you time and money."
			}
		]
	},
	"contacts": {
		"section_id": "glc-faq",
		"eyebrow": "Getting in touch",
		"title": "How to reach Gareth",
		"intro": "Call, email, WhatsApp or the form — and when you can expect a reply.",
		"items": [
			{
				"q": "How do I get in touch with GLC Web Solutions?",
				"a": "Email gareth@glcwebsolutions.co.uk or gareth.cross@telegraph.co.uk, call 07958 793388, WhatsApp, or send the form on this page. You speak to Gareth. There is no sales script and no ticket queue."
			},
			{
				"q": "What hours can I call?",
				"a": "8am to 9pm daily. Weekends are available on request."
			},
			{
				"q": "How quickly will I hear back?",
				"a": "Email is usually answered the same working day. Phone and WhatsApp are the fastest if you want to talk through a website, search, ads or a digital decision now."
			},
			{
				"q": "Do I need a full brief before we speak?",
				"a": "No. Tell us whether you need a new site, a redesign, search help, ads, or a straight opinion. We will come back with a clear next step. A short brief helps if you already have one, but it is not required to start."
			},
			{
				"q": "Is the consultation free?",
				"a": "Yes. The first conversation is free — no obligation to go ahead."
			}
		]
	},
	"our-work": {
		"section_id": "glc-faq",
		"eyebrow": "Client work",
		"title": "What the case studies show",
		"intro": "Trades, hospitality, holiday lets and local services — and whether we can do the same for you.",
		"items": [
			{
				"q": "What kinds of businesses have you built websites for?",
				"a": "Staircase joinery (Bliss Stairs), a Porth holiday let (No. 1 Longshore), life coaching (Perspective Coaching), dog walking (Waggz), Surrey garden rooms (My Retreat), and a Sunningdale plumber and gas engineer (Talis Heating Solutions). The through-line is local businesses that need the site to produce enquiries, not look pretty in a portfolio."
			},
			{
				"q": "Can I see live examples, not just screenshots?",
				"a": "Yes. Each case study includes device mockups and a path through to the live site where it is public. Our Work is the index; open a study for the brief, deliverables and results."
			},
			{
				"q": "Do you only work with trades?",
				"a": "Trades are a strong fit — electricians, plumbers, landscapers — but so are pubs, holiday lets, coaches and other sole traders. If the job is a clear website that saves you time, it is in scope."
			},
			{
				"q": "Can you build something similar for my business?",
				"a": "Yes. Case studies are examples, not templates you are stuck with. A free consultation maps what your site actually needs — quote flows, bookings, galleries, local search — then a package is chosen to match."
			},
			{
				"q": "How do I start a project like these?",
				"a": "Book a free consultation, or claim the special offer if you want to see a design first with no obligation to pay. Website builds start at £795."
			}
		]
	},
	"website-design": {
		"section_id": "glc-faq",
		"eyebrow": "Website packages",
		"title": "Design, build and hosting — answered",
		"intro": "Packages from £795, what each one includes, and the optional managed layer after launch.",
		"items": [
			{
				"q": "How much does website design and development cost?",
				"a": "Professional Basic is £795, Enterprise Plus £1,495, Commerce Enterprise £3,495. Prices are one-off. Every build includes daily backups, a test server, Controlled Vibe Coding access, Search Console and Analytics."
			},
			{
				"q": "What is the difference between the three website packages?",
				"a": "Professional Basic is a sharp site for sole traders: up to 5 pages, contact form, basic SEO, one round of revisions. Enterprise Plus is the full brochure build: up to 10 pages, custom design system, blog, Tag Manager, two revision rounds and 30 days of support. Commerce Enterprise adds booking, quote or commerce tools, integrations, GEO readiness and 60 days of support."
			},
			{
				"q": "How long does a website take to design and build?",
				"a": "The process is four stages: discover and brief, design and structure, build and refine, then launch and support. On the special offer a site can be fully live within seven days. Larger Commerce builds take longer because of tools and integrations."
			},
			{
				"q": "What is Controlled Vibe Coding access?",
				"a": "Every package includes controlled access for Claude, ChatGPT and Cursor on a test server — so future edits can be made safely without putting the live site at risk. It sits alongside daily backups, not instead of them."
			},
			{
				"q": "Do you host the website after launch?",
				"a": "Hosting setup is available, and the optional managed service looks after the live site for you. You are not left with a handover PDF and no one to call."
			},
			{
				"q": "What does the £100/month managed service include?",
				"a": "A full managed layer for the live website: £300 to start, then £100 per month with a 24-month minimum, plus bi-weekly calls to review data and performance. Daily backups and the test server from the original package stay in place."
			}
		]
	},
	"seo-geo": {
		"section_id": "glc-faq",
		"eyebrow": "Search questions",
		"title": "SEO and GEO — what the audit actually covers",
		"intro": "Eleven checks, a one-to-one walkthrough, and pricing after we have seen the site.",
		"items": [
			{
				"q": "What is GEO, and how is it different from SEO?",
				"a": "SEO is how you rank in Google. GEO — generative engine optimisation — is how AI answer engines understand and cite your business. The audit covers both: structure, speed, internal links, keywords, sitemaps, Search Console, local search, content and authority signals that help you show up in rankings and in generated answers."
			},
			{
				"q": "What does an SEO and GEO audit include?",
				"a": "Eleven focused checks: onsite structure, page speed, internal linking, keyword gaps, sitemaps, Search Console, current rankings, content planning, local search and Google Business Profile, a realistic link-building plan, and a full one-to-one walkthrough of the data and actions — not a 40-page PDF you never read."
			},
			{
				"q": "How much do SEO and GEO services cost?",
				"a": "They are quoted after a free consultation. The work depends on the site in front of us, the competition and the opportunity — so a one-size price list would be guesswork."
			},
			{
				"q": "Will I get a long report, or a conversation?",
				"a": "A conversation. Findings, priorities and next steps are explained in plain language so you know which changes to make first and what result to expect. An audit only creates value once it is acted on."
			},
			{
				"q": "Can you help with Google Business Profile and local search?",
				"a": "Yes. Local search setup is one of the eleven checks: Google Business Profile, NAP consistency and location signals, so nearby customers can find and trust the business — and so an AI assistant can recommend you when someone asks for help nearby."
			},
			{
				"q": "Do I need a new website before SEO is worth doing?",
				"a": "Not always. If the current site can be crawled, we start with the audit. If the site is slow, unclear or impossible to maintain, the website is the better first move — search work on a weak site wastes money."
			}
		]
	},
	"consultancy": {
		"section_id": "glc-faq",
		"eyebrow": "Consultancy questions",
		"title": "Strategy without the slide deck",
		"intro": "What 27 years at The Telegraph means for a small business, and how sessions are scoped.",
		"items": [
			{
				"q": "What does digital consultancy with GLC actually cover?",
				"a": "One-to-one guidance on digital strategy, design and development decisions, commercialisation, platforms and vendors. Nine areas sit on the page — from Telegraph-honed innovation through to honest toolchain advice — and sessions are scoped to the decision you need, not a generic framework."
			},
			{
				"q": "How is this different from hiring a digital agency?",
				"a": "You get a person who has lived digital product, advertising operations and strategy inside The Telegraph for 27 years — not a slide deck from a junior consultant. Recommendations are practical, sized to a small business, and independent of vendor upsells."
			},
			{
				"q": "How is consultancy priced?",
				"a": "Quoted after a free consultation. Scope and fee follow the brief — a single decision, a roadmap, or ongoing sessions alongside a build. There is no menu of retainers you have to pick from before we know the problem."
			},
			{
				"q": "What does 27 years at The Telegraph mean for my business?",
				"a": "Front-line experience in a newsroom that had to innovate digitally to survive: design and development exposure, cross-functional delivery, high-level strategy and how a major publisher commercialises its audience. Those lessons translate to how a sole trader should think about a site, ads and revenue — without national-media overhead."
			},
			{
				"q": "Can consultancy sit alongside a website build?",
				"a": "Yes. Many clients want a decision first, then a build. Others already have a site and need direction on search, ads or platforms. Consultancy is available on its own or with website, SEO or paid marketing work."
			}
		]
	},
	"paid-marketing": {
		"section_id": "glc-faq",
		"eyebrow": "Paid ads",
		"title": "Google Ads and Meta Ads — answered",
		"intro": "Setup from £550, monthly management, landing pages, and how you see what spend produced.",
		"items": [
			{
				"q": "How much does it cost to set up Google Ads and Meta Ads?",
				"a": "Setup and launch is £550 one-off and covers two platforms — Google Ads and Meta Ads (Facebook and Instagram) — including campaign structure, tracking, audience and keyword research, launch creative, conversion foundations and handover."
			},
			{
				"q": "What does the £150 per month Maintain package include?",
				"a": "Ongoing management so spend stays efficient: bi-weekly insights and consultation, budget management, insight reports from the data, and creative refreshes. Commit annually and the £550 setup fee is waived."
			},
			{
				"q": "When would I choose the £500 per month full-service package?",
				"a": "When you need new landing pages and ongoing page optimisation as well as media buying. It includes everything in Maintain, plus lookalike and retargeting strategy and reporting across platforms."
			},
			{
				"q": "Is ad spend included in those fees?",
				"a": "No. The packages are for setup and management. Media spend sits in your Google and Meta accounts so you can see exactly what went out and what came back."
			},
			{
				"q": "Will I know what the ads actually produced?",
				"a": "Yes. Conversion tracking is in place before launch, then reporting and attribution connect spend to enquiries, bookings or sales — not vanity reach. That is the point of the process: audit, structure, launch, then optimise with numbers you can act on."
			},
			{
				"q": "Do I need a website before running ads?",
				"a": "You need a page that can convert. If the current site leaks traffic, we fix landing pages as part of the full-service package — or we start with the website. Paid media on a weak page burns budget."
			}
		]
	},
	"services": {
		"section_id": "glc-faq",
		"eyebrow": "Choosing a service",
		"title": "Where to start, and what sits around the website",
		"intro": "Website design, SEO & GEO, paid ads and consultancy — you do not have to buy all four.",
		"items": [
			{
				"q": "What services does GLC Web Solutions offer?",
				"a": "Four connected offerings: website design and development from £795, SEO & GEO audits, Google Ads and Meta Ads from £550 setup, and digital consultancy shaped by 27 years at The Telegraph. Start with what you need now and add the rest without switching agencies."
			},
			{
				"q": "Do I have to buy website, SEO and ads together?",
				"a": "No. Most clients start with the website. Search, ads and consultancy are added only where they save time and money."
			},
			{
				"q": "Where should a sole trader start?",
				"a": "With a site that is clear on a phone and easy to enquire through. If people already know you but cannot find you, add SEO & GEO. If you need enquiries faster than search will allow, add paid ads. If you are stuck on a digital decision, book consultancy."
			},
			{
				"q": "Who are these services for?",
				"a": "Sole traders and small businesses — trades, pubs, holiday lets, coaches and local services across London and the South-East — who want professional work at a cost-effective price, without sales waffle."
			},
			{
				"q": "How do I see prices for each service?",
				"a": "The Costs page lists every published package in one place. SEO and consultancy stay quoted after a conversation because the work depends on the site in front of us. A free consultation is always available."
			}
		]
	},
	"electricians": {
		"section_id": "glc-electricians-faq",
		"eyebrow": "Questions electricians ask",
		"title": "Website design, build and hosting — answered",
		"intro": "Straight answers for electrical contractors in London and the South-East who want a custom site without taking time off the tools.",
		"items": [
			{
				"q": "How much does website design for electricians in London cost?",
				"a": "Website design packages start from the Professional Basic build at £795. Electricians across London and the South-East typically choose a custom design with SEO foundations and optional full hosting so they never have to manage the site themselves."
			},
			{
				"q": "Do you host the electrician website as well as design it?",
				"a": "Yes. Design, build and hosting sit together: SSL, backups, updates and uptime monitoring. You stay on the tools; we keep the site live."
			},
			{
				"q": "Will the site help me rank for electrician searches in the South-East?",
				"a": "Every build includes local SEO foundations: service pages, coverage copy for London and South-East towns, technical setup and Google Business Profile alignment. Ongoing SEO and GEO can be added after launch."
			},
			{
				"q": "Can you add emergency call buttons and quote forms?",
				"a": "Those are standard on electrician websites we build — tap-to-call, 24/7 dispatch styling, NICEIC trust badges, and quote flows for EV chargers, consumer units, EICR and fault finding."
			},
			{
				"q": "How long does an electrician website take?",
				"a": "On the special offer a professional design is back in about 48 hours and the site can be live within seven days. Standard builds follow brief, design, build and launch — with you reviewing on a test server before anything goes public."
			},
			{
				"q": "Do I need to write the copy and take the photos?",
				"a": "Share what you already have: services, coverage area, qualifications and any photos. We structure pages around how customers actually look for an electrician — emergencies, quotes and trust — rather than leaving you with a blank WordPress dashboard."
			}
		]
	},
	"pubs": {
		"section_id": "glc-pubs-faq",
		"eyebrow": "Questions publicans ask",
		"title": "Website design, build and hosting — answered",
		"intro": "Menus, bookings, events and local search — without you having to manage the site from behind the bar.",
		"items": [
			{
				"q": "How much does website design for pubs in London cost?",
				"a": "Website design packages start from the Professional Basic build at £795. Pubs across London and the South-East typically choose a custom design with SEO foundations and optional full hosting so they never have to manage the site themselves."
			},
			{
				"q": "Do you host the pub website as well as design it?",
				"a": "Yes. Design, build and hosting sit together: SSL, backups, updates and uptime monitoring. You stay behind the bar; we keep the site live."
			},
			{
				"q": "Will the site help me rank for pub searches in the South-East?",
				"a": "Every build includes local SEO foundations: menus and events pages, coverage copy for London and South-East towns, technical setup and Google Business Profile alignment. Ongoing SEO can be added after launch."
			},
			{
				"q": "Can you add table bookings, menus and function-room enquiries?",
				"a": "Those are standard on pub websites we build — book-a-table, tap-to-call, food and drink menus, weekly events, and enquiry flows for private hire and Sunday roast."
			},
			{
				"q": "How quickly can a pub website go live?",
				"a": "A design can come back in about 48 hours on the special offer, with the finished site live within seven days — listed on Google and Bing, with Analytics and daily backups. Menus and events can be updated without you learning a CMS from scratch if we host and manage it."
			},
			{
				"q": "Can the site work on phones for people walking past?",
				"a": "Yes. Pub sites are built mobile-first: opening hours, menus, tap-to-call and directions are obvious on a small screen, because that is how most local searches happen."
			}
		]
	},
	"landscapers": {
		"section_id": "glc-landscapers-faq",
		"eyebrow": "Questions landscape gardeners ask",
		"title": "Website design, build and hosting — answered",
		"intro": "Galleries, estimators and consultation bookings — so homeowners can enquire while you stay on site.",
		"items": [
			{
				"q": "How much does website design for landscape gardeners in London cost?",
				"a": "Website design packages start from the Professional Basic build at £795. Landscape gardeners across London and the South-East typically choose a custom design with SEO foundations and optional full hosting so they never have to manage the site themselves."
			},
			{
				"q": "Do you host the landscaper website as well as design it?",
				"a": "Yes. Design, build and hosting sit together: SSL, backups, updates and uptime monitoring. You stay on site; we keep the site live."
			},
			{
				"q": "Will the site help me rank for landscape gardener searches in the South-East?",
				"a": "Every build includes local SEO foundations: project galleries, coverage copy for London and South-East towns, technical setup and Google Business Profile alignment. Ongoing SEO can be added after launch."
			},
			{
				"q": "Can you add galleries, estimators and consultation bookings?",
				"a": "Those are standard on landscape gardener websites we build — before-and-after galleries, project estimators, planting and hardscaping journeys, and clear consultation booking paths."
			},
			{
				"q": "How long does a landscape gardener website take?",
				"a": "On the special offer you can see a design in about 48 hours and go live within seven days. Gallery-led Commerce or Enterprise builds take longer only if we are wiring estimators, bookings or extra project templates."
			},
			{
				"q": "Do homeowners need to call to get a price?",
				"a": "Not if you do not want them to. Estimators and consultation bookings let serious enquiries arrive with the details you need — garden size, finish, photos — instead of a vague voicemail while you are on a job."
			}
		]
	},
	"location": {
		"section_id": "glc-faq",
		"eyebrow": "{{place}} questions",
		"title": "Website services in {{place}} — answered",
		"intro": "Design, hosting, SEO, GEO and paid ads for sole traders and small businesses — with prices that will not be beaten.",
		"items": [
			{
				"q": "Do you offer website design in {{place}}?",
				"a": "Yes. Bespoke, conversion-focused website design for sole traders and small businesses in {{place}} — built to look sharp on every device and reflect how the business actually works. Packages start at £795."
			},
			{
				"q": "Can you help with SEO and GEO for a {{place}} business?",
				"a": "Yes. Technical and on-page SEO tuned for {{place}} search, plus generative engine optimisation and local entity signals so you show up in Google, map-led discovery and AI answers. SEO is quoted after a free consultation."
			},
			{
				"q": "Do you run ads for local {{place}} businesses?",
				"a": "Yes. Google Ads and paid search for high-intent keywords, plus Meta campaigns on Facebook and Instagram for local audiences. Setup and launch is £550; ongoing management from £150 a month."
			},
			{
				"q": "How much do {{place}} website services cost?",
				"a": "Website builds start at £795. Hosting, SSL, backups and uptime monitoring keep the site online for local customers. Full prices sit on the Costs page; a free consultation is the fastest way to match a package to the job."
			},
			{
				"q": "Do I need to be based in {{place}} to work with you?",
				"a": "No, but this page is for businesses serving {{place}} and the surrounding area. GLC is based in Dartford and works across London and the South-East by call, WhatsApp and video — you do not need to visit an office to get a site live."
			},
			{
				"q": "Who actually does the work?",
				"a": "Gareth Cross designs, builds and looks after the site himself. No outsourced developers and no junior bench. You book a free consultation and speak to the person who will do the job."
			}
		]
	},
	"case-waggz": {
		"section_id": "glc-faq",
		"eyebrow": "This project",
		"title": "Website design for dog walkers — answered",
		"intro": "What Waggz needed, how local search was built in, and whether a similar site would work for another walker.",
		"items": [
			{
				"q": "What did website design for Waggz Dog Walking include?",
				"a": "A mobile-first site for a local dog-walking business: clear services, trust, and a path to enquire. The work also included GEO-targeted SEO so nearby owners could find Waggz when they searched for a walker."
			},
			{
				"q": "How did the site help with local search?",
				"a": "Local landing signals, service copy and technical SEO were built in from the start — not bolted on later — so the site could compete for dog-walking searches in the areas Waggz actually covers."
			},
			{
				"q": "Can you build a similar website for another dog walker?",
				"a": "Yes. The pattern is the same for other pet services: phone-first layout, obvious contact, coverage areas and local search foundations. Packages start at £795; a free consultation confirms what you need."
			},
			{
				"q": "Do I need lots of professional photos first?",
				"a": "Strong photos help, but they are not a blocker. We work with what you have and structure the site so trust is obvious — walks, coverage, how to book — then improve imagery over time if needed."
			}
		]
	},
	"case-bliss": {
		"section_id": "glc-faq",
		"eyebrow": "This project",
		"title": "The Bliss Stairs website — answered",
		"intro": "Photography, quotes, WhatsApp and FAQs for a Kent staircase workshop.",
		"items": [
			{
				"q": "What did the Bliss Stairs website need to do?",
				"a": "Show the craft clearly, answer planning questions on the page, and make it easy to request a quote or WhatsApp the Chatham workshop. Homeowners planning a staircase should not have to hunt for the next step."
			},
			{
				"q": "Why were FAQs such a big part of the build?",
				"a": "Staircase projects raise the same doubts every time: timelines, cost, materials, planning. Grouped FAQs handle those on the page so the inbox is not full of the same questions before anyone is ready to quote."
			},
			{
				"q": "Is this approach useful for other joinery or home-improvement businesses?",
				"a": "Yes. Photography-led pages, honest practicalities and a clear quote path work for joinery, staircases, garden rooms and similar high-consideration work. The special offer lets you see a design with no obligation to pay."
			},
			{
				"q": "Did Bliss have to manage the website themselves?",
				"a": "No. The point of the build is that the workshop stays on the tools. Hosting, structure and enquiry paths are set up so the site works while they make stairs."
			}
		]
	},
	"case-talis": {
		"section_id": "glc-faq",
		"eyebrow": "This project",
		"title": "The Talis Heating website — answered",
		"intro": "Trust, emergencies and local search for a plumber and gas engineer.",
		"items": [
			{
				"q": "What makes a plumber and gas engineer website convert?",
				"a": "Trust first: Gas Safe, services spelled out, mobile call paths, and pages for boiler repair, installation and safety certificates. Talis needed homeowners in Sunningdale and nearby areas to reach someone quickly — especially on an emergency."
			},
			{
				"q": "How did local search fit into the Talis site?",
				"a": "Service clarity and local search foundations were built in so people looking for a plumber or gas engineer nearby could find and trust the business, then call from a phone without digging through the site."
			},
			{
				"q": "Can you build a similar site for another heating engineer?",
				"a": "Yes. Trade sites follow the same pattern: tap-to-call, clear services, reviews and local SEO. Website packages start at £795, with electrician, pub and landscaper landings if your trade is closer to those examples."
			},
			{
				"q": "Do emergency call-outs need a special page?",
				"a": "They need to be obvious on every device. On Talis that meant a trust-first homepage and mobile call paths, not a buried contact form. We design the same pattern for other emergency trades."
			}
		]
	},
	"case-longshore": {
		"section_id": "glc-faq",
		"eyebrow": "This project",
		"title": "The No. 1 Longshore website — answered",
		"intro": "Book Direct, availability and a guest book for a Porth coastal let.",
		"items": [
			{
				"q": "What was the brief for No. 1 Longshore?",
				"a": "A photography-led booking site for a Porth coastal retreat: Book Direct beside Airbnb, live availability, and a guest book that lives on the property domain — facilities such as parking, pets, kitchen and workspace shown as facts, not a buried FAQ."
			},
			{
				"q": "Why put Book Direct next to Airbnb?",
				"a": "Guests already know the listing platforms. Sitting Book Direct beside them makes the cheaper, direct stay obvious without pretending Airbnb does not exist. Availability has to be accurate or the path fails."
			},
			{
				"q": "Can you build a holiday-let website like this?",
				"a": "Yes. Coastal and rural lets need photography, clear house rules, booking and a reason to go direct. Commerce Enterprise is the usual fit when booking tools are involved; a consultation confirms the stack."
			},
			{
				"q": "Does the guest book have to be on Airbnb only?",
				"a": "No. For Longshore the guest book sits on the property domain so reviews and stories strengthen the branded site, not only the listing platform."
			}
		]
	},
	"case-perspective": {
		"section_id": "glc-faq",
		"eyebrow": "This project",
		"title": "The Perspective Coaching website — answered",
		"intro": "Booking and a calm, clear presence for a life-coaching practice.",
		"items": [
			{
				"q": "What did Perspective Coaching need from a website?",
				"a": "A calm, credible presence for high-performance life coaching: empathetic layout, a clear story, and a streamlined booking workflow so the right clients could start without friction."
			},
			{
				"q": "How does booking work on a coaching site?",
				"a": "The journey is kept short: understand the offer, then book. We avoid clutter and keep the primary action obvious on mobile, which is where most first visits happen."
			},
			{
				"q": "Can you build a site for other coaches or wellness businesses?",
				"a": "Yes. Personal-brand sites need trust, a simple booking or enquiry path, and copy that sounds like the practitioner. Packages start at £795; Enterprise Plus is typical if you want a blog or richer enquiry flows."
			},
			{
				"q": "Do I need to supply all the copy myself?",
				"a": "You know the practice; we structure pages and tone. A short brief and a conversation is enough to start — you are not asked to write a 20-page document before design begins."
			}
		]
	},
	"case-retreat": {
		"section_id": "glc-faq",
		"eyebrow": "This project",
		"title": "The My Retreat Garden Rooms website — answered",
		"intro": "Imagery, local SEO and quote journeys for a Surrey garden-rooms maker.",
		"items": [
			{
				"q": "What did My Retreat Garden Rooms need online?",
				"a": "A premium showcase for Surrey homeowners: imagery-led design, local SEO foundations, and a clear path to request a quote for a garden room or studio."
			},
			{
				"q": "How does the site help people request a quote?",
				"a": "The layout leads with the product, then process and contact — so someone who has been browsing studios can enquire without hunting. Quote journeys sit with the photography, not in a footer afterthought."
			},
			{
				"q": "Is this useful for other home-improvement showcases?",
				"a": "Yes. Garden rooms, extensions, joinery and similar visual products need the work on screen and a low-friction quote. Bliss Stairs is a related example if the product is more crafted-to-order than a standard range."
			},
			{
				"q": "Does local SEO matter if most leads come from referrals?",
				"a": "Referrals still check you online. Local SEO foundations mean the site supports those searches and captures people in Surrey who found you without a personal introduction."
			}
		]
	}
};
