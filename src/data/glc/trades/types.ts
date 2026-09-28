export type TradeKey = "electricians" | "pubs" | "landscapers";
export type TradeDevice = "laptop" | "phone";

export interface TradeIntro {
	eyebrow: string;
	title: string;
	lead: string;
}

export interface TradeCta {
	label: string;
	url: string;
}

export interface TradeHero {
	eyebrow: string;
	titleLead: string;
	titleAccent: string;
	lead: string;
	primaryCta: TradeCta;
	secondaryCta: TradeCta;
	showWhatsapp: boolean;
	character: { src: string; width: number; height: number };
}

export interface TradeFeature {
	icon: string;
	title: string;
	text: string;
}

export interface TradeShowcaseItem {
	screen: string;
	device: TradeDevice;
	layout: "feature" | "half";
	title: string;
	caption: string;
}

export interface TradePhoneItem {
	screen: string;
	title: string;
	caption: string;
}

export interface TradeData {
	key: TradeKey;
	/** Slugs that resolve to this landing page (glc_<trade>_page_slugs) */
	slugs: string[];
	bodyClass: string[];
	urlLabel: string;
	screens: string[];
	/** Extra class on .glc-device (pubs/landscapers add glc-device--<trade>) */
	deviceClass: string;
	whatsappMessage: string;
	hero: TradeHero;
	fullService: TradeIntro & { points: string[]; screen: string };
	featuresIntro: TradeIntro;
	features: TradeFeature[];
	showcaseIntro: TradeIntro;
	showcase: TradeShowcaseItem[];
	showcasePhones: TradePhoneItem[];
	processIntro: TradeIntro;
	pricingIntro: TradeIntro;
	areas: TradeIntro & { places: string[] };
	studiesIntro: TradeIntro & { linkLabel: string; linkUrl: string };
	contact: TradeIntro & {
		asideTitle: string;
		asidePoints: string[];
		offerLabel: string;
		offerUrl: string;
		formLead: string;
	};
}
