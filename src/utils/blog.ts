import { getEmDashCollection, getTermsForEntries } from "emdash";
import postImages from "../generated/post-images.json";
import { listingDescription } from "../data/glc/seo";
import { getReadingTime } from "./reading-time";

export interface BlogImage {
	src: string;
	srcset?: string;
	width?: number;
	height?: number;
	alt: string;
}

export interface BlogTopic {
	slug: string;
	label: string;
}

export interface BlogPost {
	slug: string;
	url: string;
	title: string;
	excerpt: string;
	published?: Date;
	readingTime: number;
	topics: BlogTopic[];
	image: BlogImage | null;
}

export interface BlogTopicCount extends BlogTopic {
	count: number;
}

export interface BlogHeading {
	heading: string;
	intro: string;
	/** Full document title, applied when the topic is chosen in place */
	title: string;
}

/** Topics left out of the filter bar; their posts still appear under "All". */
const HIDDEN_TOPICS = new Set(["uncategorized"]);

const images: Record<string, BlogImage> = postImages;

function featuredImage(slug: string, title: string, featured: unknown): BlogImage | null {
	if (images[slug]) return images[slug];
	const image = featured as {
		src?: unknown;
		alt?: unknown;
		width?: unknown;
		height?: unknown;
		meta?: { storageKey?: unknown };
	} | null;
	const storageKey = image?.meta?.storageKey;
	const src =
		typeof image?.src === "string" && image.src
			? image.src
			: typeof storageKey === "string" && storageKey
				? `/_emdash/api/media/file/${storageKey}`
				: "";
	if (!src) return null;
	const alt = typeof image?.alt === "string" && image.alt ? image.alt : title;
	return {
		src,
		alt,
		...(typeof image?.width === "number" ? { width: image.width } : {}),
		...(typeof image?.height === "number" ? { height: image.height } : {}),
	};
}

/** Every published post, newest first, with its categories and listing image. */
export async function loadBlog() {
	const { entries, cacheHint } = await getEmDashCollection("posts", {
		orderBy: { published_at: "desc" },
		limit: 200,
	});
	const topicsByEntry = await getTermsForEntries(
		"posts",
		entries.map((post) => post.data.id),
		"category",
	);

	const counts = new Map<string, BlogTopicCount>();
	const posts: BlogPost[] = entries.map((post) => {
		const title = typeof post.data.title === "string" ? post.data.title : post.id;
		const topics = (topicsByEntry.get(post.data.id) ?? []).map(({ slug, label }) => ({ slug, label }));
		for (const topic of topics) {
			const entry = counts.get(topic.slug) ?? { ...topic, count: 0 };
			entry.count++;
			counts.set(topic.slug, entry);
		}
		return {
			slug: post.id,
			url: `/${post.id}/`,
			title,
			excerpt: typeof post.data.excerpt === "string" ? post.data.excerpt : "",
			published: post.data.publishedAt ?? undefined,
			readingTime: getReadingTime(post.data.content),
			topics,
			image: featuredImage(post.id, title, post.data.featured_image),
		};
	});

	const topics = [...counts.values()]
		.filter((topic) => !HIDDEN_TOPICS.has(topic.slug))
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

	return { posts, topics, cacheHint };
}

/** Heading, intro and document title of a category page, shared with the blog page's in-place filter. */
export function topicHeading(topic: BlogTopic, siteTitle: string): BlogHeading {
	return {
		heading: `${topic.label} articles`,
		intro:
			listingDescription(`/category/${topic.slug}/`) ??
			`${topic.label} articles from the GLC Web Solutions blog.`,
		title: `${topic.label} Articles | ${siteTitle}`,
	};
}
