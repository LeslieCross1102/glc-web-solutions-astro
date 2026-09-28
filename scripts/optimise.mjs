#!/usr/bin/env node
/**
 * Build-time optimisation for the pages rendered from Local WordPress.
 *
 *   1. WebP copies of every PNG/JPEG under public/glc/uploads and public/glc/assets/images
 *   2. content/rendered/<key>.html → public/glc/rendered/<key>.html
 *      (WebP sources, lazy-loading below the hero, intrinsic sizes, static Google reviews widget)
 *   3. Per-page purged + minified CSS → public/glc/rendered/<key>.css,
 *      plus fallback bundles for non-rendered routes → public/glc/build/css/<combo>.css
 *   4. One minified JS bundle → public/glc/build/site.<hash>.js
 *
 * Writes src/generated/assets.json (script URL + font preloads) for the layout.
 * Run after scripts/render-from-local.py and scripts/fetch-fonts.py:  node scripts/optimise.mjs
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import * as esbuild from "esbuild";
import { transform as lightning } from "lightningcss";
import { PurgeCSS } from "purgecss";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const RAW_DIR = path.join(ROOT, "content/rendered");
const OUT_DIR = path.join(PUBLIC, "glc/rendered");
const BUILD_DIR = path.join(PUBLIC, "glc/build");
const GENERATED = path.join(ROOT, "src/generated");

const manifest = JSON.parse(await fs.readFile(path.join(ROOT, "src/rendered/manifest.json"), "utf8"));
const wpStyles = JSON.parse(await fs.readFile(path.join(ROOT, "src/rendered/head-styles.json"), "utf8"));

const exists = (p) => fs.stat(p).then((s) => s, () => null);

async function walk(dir) {
	const out = [];
	for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...(await walk(full)));
		else out.push(full);
	}
	return out;
}

async function pool(items, size, fn) {
	const queue = [...items];
	await Promise.all(Array.from({ length: size }, async () => {
		while (queue.length) await fn(queue.shift());
	}));
}

/* ------------------------------------------------------------------ 1. images */

const webpFor = new Map(); // "/glc/uploads/x.png" → "/glc/uploads/x.webp" when smaller

async function buildWebp() {
	const files = [
		...(await walk(path.join(PUBLIC, "glc/uploads"))),
		...(await walk(path.join(PUBLIC, "glc/assets/images"))),
	].filter((f) => /\.(png|jpe?g)$/i.test(f));
	let made = 0;
	await pool(files, 8, async (file) => {
		const target = file.replace(/\.(png|jpe?g)$/i, ".webp");
		const [src, dst] = await Promise.all([fs.stat(file), exists(target)]);
		if (!dst || dst.mtimeMs < src.mtimeMs) {
			await sharp(file).webp({ quality: 80, effort: 5 }).toFile(target);
			made++;
		}
		const size = (await fs.stat(target)).size;
		if (size < src.size * 0.95) {
			webpFor.set("/" + path.relative(PUBLIC, file), "/" + path.relative(PUBLIC, target));
		}
	});
	console.log(`images: ${files.length} checked, ${made} converted, ${webpFor.size} served as WebP`);
}

const toWebp = (url) => {
	const clean = url.split(/[?#]/)[0];
	return webpFor.get(clean) ?? url;
};

/* Responsive variants sized from scripts/measure-images.mjs (CSS px at 412/768/1024/1350 wide). */
const measured = JSON.parse(await fs.readFile(path.join(GENERATED, "image-sizes.json"), "utf8").catch(() => "{}"));
const VARIANT_WIDTHS = [64, 80, 96, 128, 160, 200, 240, 280, 320, 400, 480, 560, 640, 720, 800, 1024, 1280];
const BREAKPOINTS = [[480, 412], [800, 768], [1100, 1024]];
const rasterFor = new Map(); // filled after buildWebp: webp → original raster
const variantJobs = new Map();

function makeVariant(source, width) {
	const target = source.replace(/\.(png|jpe?g|webp)$/i, `-w${width}.webp`);
	if (!variantJobs.has(target)) {
		variantJobs.set(target, (async () => {
			const [src, dst] = await Promise.all([fs.stat(path.join(PUBLIC, source)), exists(path.join(PUBLIC, target))]);
			if (!dst || dst.mtimeMs < src.mtimeMs) {
				await sharp(path.join(PUBLIC, source))
					.resize({ width })
					.webp({ quality: 78, alphaQuality: 80, effort: 6 })
					.toFile(path.join(PUBLIC, target));
			}
			return target;
		})());
	}
	return variantJobs.get(target);
}

/** Rendered widths for the nth occurrence of src on a page, falling back to the site-wide maximum. */
function measuredWidths(pageKey, src, occurrence) {
	const own = measured.pages?.[pageKey]?.[src]?.[occurrence];
	if (own && Math.max(...own) > 0) return own;
	return measured.global?.[src];
}

/** srcset + sizes for an <img> whose rendered widths were measured, or null to leave it alone. */
async function responsiveAttrs(tag, widths) {
	const src = /\ssrc="([^"]+)"/.exec(tag)?.[1];
	if (!src || !widths || Math.max(...widths) === 0) return null;
	const fallback = Math.max(...widths);
	const [m412, m768, m1024, m1350] = widths.map((w) => w || fallback);

	const candidates = [src, ...(/\ssrcset="([^"]+)"/.exec(tag)?.[1].split(",").map((p) => p.trim().split(/\s+/)[0]) ?? [])]
		.filter((u) => /^\/glc\/.+\.(png|jpe?g|webp)$/i.test(u));
	let largest = null;
	for (const url of candidates) {
		const size = await intrinsicSize(url);
		if (size && (!largest || size.width > largest.width)) largest = { url, ...size };
	}
	if (!largest) return null;

	const need = 2 * Math.max(m412, m768, m1024, m1350);
	const source = rasterFor.get(largest.url) ?? largest.url;
	const set = [];
	for (const w of VARIANT_WIDTHS) {
		if (w >= largest.width) break;
		set.push([await makeVariant(source, w), w]);
		if (w >= need) break;
	}
	if (!set.length || set.at(-1)[1] < need) set.push([toWebp(largest.url), largest.width]);

	// Phones (≤480) and wide images scale with the viewport (vw); narrow ones on larger screens are
	// fixed-size elements (px, rounded up to the breakpoint).
	const slot = (w, bp, vw) =>
		bp <= 480 || w / vw > 0.5 ? `${Math.ceil((w / vw) * 100)}vw` : `${Math.ceil((w * bp) / vw)}px`;
	const sizes = [
		...BREAKPOINTS.map(([bp, vw], i) => `(max-width: ${bp}px) ${slot([m412, m768, m1024][i], bp, vw)}`),
		`${Math.max(m1024, m1350)}px`,
	].join(", ");
	return { srcset: set.map(([u, w]) => `${u} ${w}w`).join(", "), sizes };
}

/* ------------------------------------------------------------------ 2. html */

const REVIEW_IMAGES = {
	"https://cdn.trustindex.io/assets/platform/Google/icon.svg": "/glc/uploads/reviews/google-icon.webp",
	"https://cdn.trustindex.io/assets/platform/Google/star/f.svg": "/glc/uploads/reviews/google-star.svg",
	"https://lh3.googleusercontent.com/a-/ALV-UjUBoBqJdZn_T4z_Ng34mLeMWzJnaxSlLe6JStbHpwdT-RPzQoQ=w64-h64-c-rp-mo-br100":
		"/glc/uploads/reviews/avatar-lisa-cory.png",
	"https://lh3.googleusercontent.com/a/ACg8ocIWPLhOD2KS1WwO7CSxIWsNN5TG8nOScEL6PZU2MpGcfVG9sA=w64-h64-c-rp-mo-br100":
		"/glc/uploads/reviews/avatar-kieron-summerhayes.png",
};

/** Swap the Trustindex template + remote loader for the widget markup itself. */
function staticReviews(html) {
	let found = false;
	html = html.replace(
		/<pre class="ti-widget"[^>]*>\s*<template id="trustindex-google-widget-html">([\s\S]*?)<\/template>\s*<\/pre>\s*<div data-src="https:\/\/cdn\.trustindex\.io\/loader\.js[^"]*"[^>]*>\s*<\/div>/g,
		(_, inner) => {
			found = true;
			return inner;
		},
	);
	if (!found) return { html, reviews: false };
	html = html
		.replace(/<trustindex-image([^>]*?)data-imgurl="([^"]+)"([^>]*)><\/trustindex-image>/g, (_, a, url, b) => {
			const local = REVIEW_IMAGES[url];
			if (!local) throw new Error(`Unmapped review image ${url}`);
			const sized = /\bwidth=/.test(a + b) ? "" : ' width="64" height="64"';
			return `<img${a}src="${local}"${b}${sized} decoding="async">`;
		})
		.replace(/style="opacity: 0;height: 0 !important;overflow: hidden !important"/g, "")
		.replace(/(<span class="ti-read-more"[^>]*data-open-text="([^"]*)"[^>]*>)<\/span>/g, "$1<span>$2</span></span>");
	return { html, reviews: true };
}

const sizeCache = new Map();
async function intrinsicSize(url) {
	const clean = url.split(/[?#]/)[0];
	if (!clean.startsWith("/glc/")) return null;
	if (clean.endsWith(".svg") && !sizeCache.has(clean)) {
		sizeCache.set(clean, fs.readFile(path.join(PUBLIC, clean), "utf8").then((svg) => {
			const root = /<svg\b[^>]*>/.exec(svg)?.[0] ?? "";
			const num = (name) => Number(new RegExp(`\\s${name}="([\\d.]+)(px)?"`).exec(root)?.[1]);
			const box = /\sviewBox="[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)"/.exec(root);
			const width = num("width") || Number(box?.[1]);
			const height = num("height") || Number(box?.[2]);
			return width && height ? { width: Math.round(width), height: Math.round(height) } : null;
		}, () => null));
	}
	if (!sizeCache.has(clean)) {
		sizeCache.set(clean, sharp(path.join(PUBLIC, clean)).metadata().then(
			(m) => (m.width && m.height ? { width: m.width, height: m.height } : null),
			() => null,
		));
	}
	return sizeCache.get(clean);
}

async function optimiseImages(html, pageKey, kind) {
	// Small icons plus the first two larger images before the first section closes are treated as above the fold.
	// Archive heroes are text-only, so their first post card image is the LCP instead.
	const firstSectionEnd = html.indexOf("</section>");
	const heroEnd = firstSectionEnd === -1 ? 4000 : firstSectionEnd;
	const tags = [...html.matchAll(/<img\b[^>]*>/g)];
	const isIcon = (tag) => Number(/\swidth="(\d+)"/.exec(tag)?.[1] ?? Infinity) <= 48;
	const heroOrder = new Map();
	for (const m of tags) {
		if (m.index < heroEnd && !isIcon(m[0])) heroOrder.set(m.index, heroOrder.size);
	}
	const archiveLead = kind === "archive" && heroOrder.size === 0 ? tags.find((m) => !isIcon(m[0]))?.index : undefined;
	const occurrences = new Map();
	const replacements = await Promise.all(tags.map(async (m) => {
		let tag = m[0];
		tag = tag.replace(/\ssrc="([^"]+)"/, (_, url) => ` src="${toWebp(url)}"`);
		tag = tag.replace(/\ssrcset="([^"]+)"/, (_, set) =>
			` srcset="${set.split(",").map((part) => {
				const [url, ...rest] = part.trim().split(/\s+/);
				return [toWebp(url), ...rest].join(" ");
			}).join(", ")}"`,
		);
		if (!/\swidth=/.test(tag) || !/\sheight=/.test(tag)) {
			const src = /\ssrc="([^"]+)"/.exec(tag)?.[1];
			const size = src && (await intrinsicSize(src));
			if (size) tag = tag.replace(/<img\b/, `<img width="${size.width}" height="${size.height}"`);
		}
		const src = /\ssrc="([^"]+)"/.exec(tag)?.[1];
		const occurrence = occurrences.get(src) ?? 0;
		occurrences.set(src, occurrence + 1);
		const responsive = await responsiveAttrs(tag, src && measuredWidths(pageKey, src, occurrence));
		if (responsive) {
			tag = tag.replace(/\s(srcset|sizes)="[^"]*"/g, "");
			tag = tag.replace(/<img\b/, `<img srcset="${responsive.srcset}" sizes="${responsive.sizes}"`);
		}
		const aboveFold = m.index < heroEnd && (isIcon(m[0]) || heroOrder.get(m.index) < 2);
		if (m.index === archiveLead) {
			tag = tag.replace(/\sloading="lazy"/, "");
			if (!/\sfetchpriority=/.test(tag)) tag = tag.replace(/<img\b/, '<img fetchpriority="high"');
		} else if (aboveFold) {
			tag = tag.replace(/\sloading="lazy"/, "");
		} else if (heroOrder.has(m.index) && /\sloading="eager"/.test(tag) && !/\sfetchpriority=/.test(tag)) {
			// Theme-forced eager images further down the hero still load early, just behind the critical path.
			tag = tag.replace(/<img\b/, '<img fetchpriority="low"');
		} else if (!/\sloading=/.test(tag)) {
			tag = tag.replace(/<img\b/, '<img loading="lazy"');
		}
		if (!/\sdecoding=/.test(tag)) tag = tag.replace(/<img\b/, '<img decoding="async"');
		return tag;
	}));
	let out = "";
	let last = 0;
	tags.forEach((m, i) => {
		out += html.slice(last, m.index) + replacements[i];
		last = m.index + m[0].length;
	});
	out += html.slice(last);
	return out.replace(/<iframe\b(?![^>]*\sloading=)/g, '<iframe loading="lazy"');
}

/**
 * Renumber headings that skip levels (e.g. h1 → h5) so the outline is sequential. Each renumbered heading
 * keeps its look through a glc-h<original> class styled in a11y.css.
 */
function fixHeadingOrder(html) {
	const levels = [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
	if (!levels.some((l, i) => l > (i ? levels[i - 1] : 1) + 1)) return html;
	const used = [...new Set(levels.filter((l) => l > 1))].sort();
	const map = new Map(used.map((l, i) => [l, i + 2]));
	return html.replace(/<(\/?)h([2-6])\b([^>]*)>/g, (tag, close, level, attrs) => {
		const to = map.get(Number(level));
		if (to === Number(level)) return tag;
		if (close) return `</h${to}>`;
		const withClass = /\sclass="/.test(attrs)
			? attrs.replace(/\sclass="/, ` class="glc-h${level} `)
			: `${attrs} class="glc-h${level}"`;
		return `<h${to}${withClass}>`;
	});
}

/**
 * Replace YouTube iframes that have a local poster (/glc/uploads/video/<id>.webp) with a poster button;
 * embeds.js swaps in the real iframe near the viewport or on click.
 */
async function youtubeFacades(html) {
	const frames = [...html.matchAll(/<iframe\b[^>]*\ssrc="(https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/([\w-]+)[^"]*)"[^>]*><\/iframe>/g)];
	for (const [tag, src, id] of frames) {
		const poster = `/glc/uploads/video/${id}.webp`;
		const size = await intrinsicSize(poster);
		if (!size) continue;
		const title = /\stitle="([^"]*)"/.exec(tag)?.[1] ?? "YouTube video";
		html = html.replace(
			tag,
			`<button type="button" class="glc-yt" data-glc-yt="${src}" data-title="${title}" aria-label="Play video: ${title}">` +
				`<img src="${poster}" width="${size.width}" height="${size.height}" alt="" loading="lazy" decoding="async"></button>`,
		);
	}
	return html;
}

const decodeEntities = (s) =>
	s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8217;|&rsquo;/g, "’").replace(/&#8211;|&ndash;/g, "–")
		.replace(/&#8212;|&mdash;/g, "—").replace(/&#8220;|&ldquo;/g, "“").replace(/&#8221;|&rdquo;/g, "”")
		.replace(/&#8230;|&hellip;/g, "…").replace(/&#039;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

// Pages whose opening paragraph doesn't make a usable description (the privacy page body is a vendor template).
const DESCRIPTION_OVERRIDES = {
	"privacy-policy": "How GLC Web Solutions collects, uses, stores and protects your personal data, including cookies, contact forms and embedded content.",
	"glc-location-page-blocks": "Reference layout of the content blocks used on GLC Web Solutions location pages.",
};

/** Archive pages list post excerpts rather than an intro, so describe them from their heading. */
function archiveDescription(html) {
	const title = /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1].replace(/<[^>]+>/g, "").trim();
	return title
		? `${decodeEntities(title)} articles from the GLC Web Solutions blog: practical website, search and marketing guides for UK small businesses.`
		: null;
}

/** Fallback meta description: the first substantial paragraph after the page heading, trimmed to ~155 chars. */
function fallbackDescription(html) {
	const start = Math.max(0, html.search(/<h1\b/));
	for (const m of html.slice(start).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)) {
		const text = decodeEntities(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
		if (text.length < 70) continue;
		if (text.length <= 158) return text;
		return `${text.slice(0, 155).replace(/\s+\S*$/, "")}…`;
	}
	return null;
}

/** Optimised featured image of each post, keyed by post slug, for the blog listing (the CMS only holds the original PNG). */
function postImages(pages) {
	const images = {};
	for (const page of pages) {
		if (page.kind !== "post" || page.route === "/all-posts/") continue;
		const tag = /<img\b[^>]*\bwp-post-image\b[^>]*>/.exec(page.html)?.[0];
		if (!tag) continue;
		const attr = (name) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
		images[page.route.split("/").filter(Boolean).pop()] = {
			src: attr("src"),
			srcset: attr("srcset"),
			width: Number(attr("width")),
			height: Number(attr("height")),
			alt: decodeEntities(attr("alt") ?? ""),
		};
	}
	return images;
}

async function buildHtml() {
	await fs.mkdir(OUT_DIR, { recursive: true });
	const pages = [];
	const seen = new Set();
	for (const [route, page] of Object.entries(manifest)) {
		if (seen.has(page.key)) continue;
		seen.add(page.key);
		let html = await fs.readFile(path.join(RAW_DIR, `${page.key}.html`), "utf8");
		const reviews = staticReviews(html);
		for (const [remote, local] of Object.entries(REVIEW_IMAGES)) {
			reviews.html = reviews.html.replaceAll(`src="${remote}"`, `src="${local}"`);
		}
		html = await optimiseImages(reviews.html, page.key, page.kind);
		if (page.kind === "page") html = fixHeadingOrder(html);
		html = await youtubeFacades(html);
		html = html
			.replace(/<link[^>]+trustindex-google-widget\.css[^>]*>/g, "")
			.replace(/(<a\b[^>]*href="\/all-posts\/"[^>]*>)\s*See more\s*<\/a>/g, '$1See more<span class="screen-reader-text"> blog posts</span></a>');
		await fs.writeFile(path.join(OUT_DIR, `${page.key}.html`), html);
		pages.push({ route, ...page, html, reviews: reviews.reviews });
	}
	const descriptions = Object.fromEntries(
		pages
			.filter((p) => p.kind !== "post")
			.map((p) => [
				p.key,
				DESCRIPTION_OVERRIDES[p.key] ?? (p.kind === "archive" ? archiveDescription(p.html) : fallbackDescription(p.html)),
			])
			.filter(([, d]) => d),
	);
	await fs.writeFile(path.join(GENERATED, "descriptions.json"), JSON.stringify(descriptions, null, "\t") + "\n");
	await fs.writeFile(path.join(GENERATED, "post-images.json"), JSON.stringify(postImages(pages), null, "\t") + "\n");
	console.log(`html: ${pages.length} pages written`);
	return pages;
}

/* ------------------------------------------------------------------ 3. css */

function cssSources({ sections, trade, reviews }) {
	return [
		"src/generated/fonts.css",
		...(trade === "pubs" || trade === "landscapers" ? ["src/generated/fonts-serif.css"] : []),
		...wpStyles.before.map((p) => `public${p}`),
		"public/glc/compat.css",
		"public/glc/assets/css/tokens.css",
		"public/glc/assets/css/foundation.css",
		"public/glc/assets/css/components.css",
		"public/glc/assets/css/astra-integration.css",
		...(sections ? ["public/glc/assets/css/home.css"] : []),
		...(trade ? [`public/glc/assets/css/${trade}.css`] : []),
		"public/glc/style.css",
		...wpStyles.after.map((p) => `public${p}`),
		...(reviews ? ["public/glc/uploads/trustindex-google-widget.css", "public/glc/trustindex-static.css"] : []),
		"public/glc/a11y.css",
	];
}

const cssFileCache = new Map();
async function readCss(rel) {
	if (!cssFileCache.has(rel)) {
		const base = rel.startsWith("public/") ? rel.slice("public".length) : "/";
		const text = (await fs.readFile(path.join(ROOT, rel), "utf8")).replace(
			/url\(\s*(['"]?)([^'")]+)\1\s*\)/g,
			(full, q, url) => {
				if (/^(data:|https?:|#)/.test(url)) return full;
				const abs = url.startsWith("/") ? url : new URL(url, `http://x${base}`).pathname;
				return `url("${toWebp(abs)}")`;
			},
		);
		cssFileCache.set(rel, `/* ${rel} */\n${text}\n`);
	}
	return cssFileCache.get(rel);
}

async function bundleCss(opts) {
	return (await Promise.all(cssSources(opts).map(readCss))).join("");
}

const PURGE_OPTIONS = {
	safelist: {
		standard: [
			/^is-/, /^has-/, /^wpcf7/, /^glc-turnstile/, /^cf-/, "light",
			"init", "submitting", "sent", "invalid", "unaccepted", "spam", "failed", "aborted",
			"screen-reader-text", "skip-link", "focus", "focus-visible",
		],
		greedy: [/data-status/, /aria-expanded/, /aria-current/],
	},
	dynamicAttributes: ["data-status", "aria-expanded", "aria-hidden", "aria-current", "hidden", "open"],
	keyframes: true,
	fontFace: false,
	variables: false,
};

async function purgeAndMinify(css, contents, label) {
	const [result] = await new PurgeCSS().purge({
		...PURGE_OPTIONS,
		css: [{ raw: css }],
		content: contents.map((raw) => ({ raw, extension: "html" })),
	});
	const { code } = lightning({
		filename: `${label}.css`,
		code: Buffer.from(result.css),
		minify: true,
		errorRecovery: true,
	});
	return code.toString();
}

function postContentDump() {
	const dir = path.join(ROOT, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
	try {
		const db = execFileSync("ls", [dir]).toString().split("\n").find((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite");
		return execFileSync("sqlite3", [path.join(dir, db), "select content from ec_posts"], {
			maxBuffer: 64 * 1024 * 1024,
		}).toString();
	} catch {
		console.warn("css: no local D1 found; post body classes come from the rendered chrome only");
		return "";
	}
}

async function readSources(globs) {
	const files = [];
	for (const g of globs) {
		const full = path.join(ROOT, g);
		const stat = await exists(full);
		if (!stat) continue;
		if (stat.isDirectory()) files.push(...(await walk(full)).filter((f) => /\.(astro|ts|js|html)$/.test(f)));
		else files.push(full);
	}
	return Promise.all(files.map((f) => fs.readFile(f, "utf8")));
}

const gz = (s) => zlib.gzipSync(s).length;

async function buildCss(pages) {
	const chrome = await readSources([
		"src/layouts/Base.astro",
		"src/components/glc/GlcHeader.astro",
		"src/components/glc/GlcFooter.astro",
		"src/components/glc/chrome.ts",
		"public/glc/assets/js/theme.js",
		"public/glc/forms.js",
		"public/glc/reviews.js",
		"public/glc/embeds.js",
	]);
	const posts = postContentDump();
	const shell = (classes) => `<html class="light"><body class="glc-theme glc-has-custom-chrome ${classes.join(" ")}"></body></html>`;

	const sizes = [];
	await pool(pages, 4, async (page) => {
		const css = await bundleCss(page);
		const contents = [page.html, shell(page.bodyClass), ...chrome, ...(page.kind === "post" ? [posts] : [])];
		const out = await purgeAndMinify(css, contents, page.key);
		await fs.writeFile(path.join(OUT_DIR, `${page.key}.css`), out);
		sizes.push(gz(out));
	});
	sizes.sort((a, b) => a - b);
	console.log(`css: ${pages.length} page sheets, gzip ${(sizes[0] / 1024).toFixed(1)}–${(sizes.at(-1) / 1024).toFixed(1)} KB (median ${(sizes[sizes.length >> 1] / 1024).toFixed(1)} KB)`);

	// Fallback bundles for routes without a rendered page (templates, 404, new EmDash content).
	const everything = [
		...pages.map((p) => p.html + shell(p.bodyClass)),
		...(await readSources(["src"])),
		...chrome,
		posts,
	];
	await fs.mkdir(path.join(BUILD_DIR, "css"), { recursive: true });
	for (const trade of [null, "electricians", "pubs", "landscapers"]) {
		for (const sections of trade ? [true] : [true, false]) {
			const name = `${sections ? "sections" : "plain"}-${trade ?? "none"}`;
			const out = await purgeAndMinify(await bundleCss({ sections, trade, reviews: true }), everything, name);
			await fs.writeFile(path.join(BUILD_DIR, "css", `${name}.css`), out);
			console.log(`css: fallback ${name} gzip ${(gz(out) / 1024).toFixed(1)} KB`);
		}
	}
}

/* ------------------------------------------------------------------ 4. js + manifest */

async function buildJs() {
	const parts = await Promise.all(
		["public/glc/assets/js/theme.js", "public/glc/forms.js", "public/glc/reviews.js", "public/glc/embeds.js"].map((f) =>
			fs.readFile(path.join(ROOT, f), "utf8"),
		),
	);
	const { code } = await esbuild.transform(parts.join(";\n"), { minify: true, target: "es2018" });
	const hash = crypto.createHash("sha1").update(code).digest("hex").slice(0, 10);
	await fs.mkdir(BUILD_DIR, { recursive: true });
	for (const old of await fs.readdir(BUILD_DIR)) {
		if (/^site\.[a-f0-9]+\.js$/.test(old)) await fs.unlink(path.join(BUILD_DIR, old));
	}
	await fs.writeFile(path.join(BUILD_DIR, `site.${hash}.js`), code);
	console.log(`js: site.${hash}.js gzip ${(gz(code) / 1024).toFixed(1)} KB`);
	return `/glc/build/site.${hash}.js`;
}

async function writeAssetManifest(script) {
	const fonts = await fs.readFile(path.join(GENERATED, "fonts.css"), "utf8");
	const preload = [
		...fonts.matchAll(/font-family: '(Plus Jakarta Sans|Inter|Material Symbols Outlined)'; font-style: normal;[^}]*url\(([^)]+)\)/g),
	].map((m) => m[2]);
	await fs.writeFile(path.join(GENERATED, "assets.json"), JSON.stringify({ script, preload }, null, "\t") + "\n");
}

await buildWebp();
for (const [raster, webp] of webpFor) rasterFor.set(webp, raster);
// Header/footer logo (src/components/glc/chrome.ts) is displayed at ≤218 CSS px.
await Promise.all([220, 360, 440].map((w) => makeVariant("/glc/uploads/glc-web-solutions-logo-2020-medium.png", w)));
const pages = await buildHtml();
await buildCss(pages);
await writeAssetManifest(await buildJs());
