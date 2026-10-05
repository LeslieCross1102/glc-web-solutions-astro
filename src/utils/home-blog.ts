import type { BlogPost } from "./blog";

/** How many posts the homepage "From the blog" carousel shows. Newest first. */
const HOME_BLOG_LIMIT = 12;
const CARD_SIZES = "(max-width: 480px) 59vw, (max-width: 800px) 252px, (max-width: 1100px) 284px, 288px";

/**
 * Replace the frozen cards in the homepage blog carousel with the latest posts.
 * The other carousels on the page reuse the same track markup, so only `#glc-home-blog` is touched.
 */
export function withLatestBlogCards(html: string, posts: BlogPost[]): string {
	const sectionStart = html.indexOf('id="glc-home-blog"');
	if (sectionStart < 0) return html;
	const sectionEnd = html.indexOf("</section>", sectionStart);
	if (sectionEnd < 0) return html;

	const section = html.slice(sectionStart, sectionEnd);
	const trackAttr = section.indexOf("data-glc-blog-track");
	if (trackAttr < 0) return html;
	const trackOpenEnd = section.indexOf(">", trackAttr);
	const articlesEnd = section.lastIndexOf("</article>");
	if (trackOpenEnd < 0 || articlesEnd < 0) return html;
	const trackClose = section.indexOf("</div>", articlesEnd);
	if (trackClose < 0) return html;

	const cards = posts
		.slice(0, HOME_BLOG_LIMIT)
		.map((post) => cardHtml(post))
		.join("\n");
	const updated =
		section.slice(0, trackOpenEnd + 1) + "\n" + cards + "\n" + section.slice(trackClose);

	return html.slice(0, sectionStart) + updated + html.slice(sectionEnd);
}

function cardHtml(post: BlogPost): string {
	const href = escapeAttr(post.url);
	const title = escapeText(post.title);
	const date = post.published ? formatDate(post.published) : "";
	const excerpt = truncate(post.excerpt);
	const image = post.image
		? `<a class="glc-home-blog-card__media" href="${href}">
<img loading="lazy"${post.image.srcset ? ` srcset="${escapeAttr(post.image.srcset)}"` : ""} sizes="${CARD_SIZES}"${
				post.image.width ? ` width="${post.image.width}"` : ""
			}${post.image.height ? ` height="${post.image.height}"` : ""} src="${escapeAttr(post.image.src)}" class="glc-home-blog-card__image" alt="${escapeAttr(post.image.alt)}" decoding="async" />
</a>`
		: "";

	return `<article class="glc-home-blog-card" data-glc-carousel-card>
${image}
<div class="glc-home-blog-card__body">
${date ? `<time class="glc-home-blog-card__date" datetime="${escapeAttr(post.published!.toISOString())}">${escapeText(date)}</time>` : ""}
<h3 class="glc-home-blog-card__title"><a href="${href}">${title}</a></h3>
${excerpt ? `<p class="glc-home-blog-card__excerpt">${escapeText(excerpt)}</p>` : ""}
<a class="glc-home-blog-card__link" href="${href}">Read article <span class="material-symbols-outlined" aria-hidden="true">north_east</span></a>
</div>
</article>`;
}

function formatDate(date: Date): string {
	const parts = new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "Europe/London",
	}).formatToParts(date);
	const day = Number(parts.find((part) => part.type === "day")?.value);
	const month = parts.find((part) => part.type === "month")?.value ?? "";
	const year = parts.find((part) => part.type === "year")?.value ?? "";
	return `${ordinal(day)} ${month} ${year}`;
}

function ordinal(day: number): string {
	const teen = day % 100;
	if (teen >= 11 && teen <= 13) return `${day}th`;
	switch (day % 10) {
		case 1:
			return `${day}st`;
		case 2:
			return `${day}nd`;
		case 3:
			return `${day}rd`;
		default:
			return `${day}th`;
	}
}

function truncate(value: string): string {
	const text = value.replace(/\s+/g, " ").trim();
	if (text.length <= 120) return text;
	const cut = text.slice(0, 120);
	const lastSpace = cut.lastIndexOf(" ");
	return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function escapeText(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function escapeAttr(value: string): string {
	return escapeText(value).replaceAll('"', "&quot;");
}
