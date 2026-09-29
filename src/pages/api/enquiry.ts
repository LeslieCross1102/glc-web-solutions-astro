import type { APIRoute } from "astro";

export const prerender = false;

interface Env {
	DB: D1Database;
	/** OAuth client and refresh token (gmail.send scope) for NOTIFY_TO's Google Workspace account */
	GMAIL_CLIENT_ID?: string;
	GMAIL_CLIENT_SECRET?: string;
	GMAIL_REFRESH_TOKEN?: string;
	/** Incoming webhook of the Google Chat space that is pinged for each enquiry */
	GOOGLE_CHAT_WEBHOOK_URL?: string;
	TURNSTILE_SECRET_KEY?: string;
}

const FORMS: Record<string, { label: string; name: string; email: string; message: string }> = {
	"73": { label: "Contact form", name: "text-your-name", email: "email-your-email", message: "textarea-your-message" },
	"4297": { label: "Special offer", name: "your-name", email: "your-email", message: "your-brief" },
};
const NOTIFY_TO = "gareth@glcwebsolutions.co.uk";
const SITE_ORIGIN = "https://glcwebsolutions.co.uk";
/** Characters shared between the field values; Google Chat rejects messages over 4,096 */
const CHAT_BUDGET = 3500;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_PER_WINDOW = 5;
const WINDOW_MINUTES = 10;

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

async function sha256(value: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyTurnstile(secret: string, token: string, ip: string | null): Promise<boolean> {
	const body = new FormData();
	body.append("secret", secret);
	body.append("response", token);
	if (ip) body.append("remoteip", ip);
	const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
	const data = (await res.json()) as { success?: boolean };
	return Boolean(data.success);
}

/** "text-your-name" → "Name", "your-path" → "Path" */
function fieldLabel(key: string): string {
	const label = key.replace(/^(text|email|tel|textarea|url|select|radio|checkbox|menu)-/, "").replace(/^your-/, "").replace(/-/g, " ");
	return label.charAt(0).toUpperCase() + label.slice(1);
}

interface Enquiry {
	form: string;
	page: string;
	name: string;
	email: string;
	fields: Record<string, string>;
}

function details(enquiry: Enquiry, limit = Infinity): [string, string][] {
	return Object.entries(enquiry.fields)
		.filter(([key]) => !key.startsWith("acceptance-"))
		.map(([key, v]) => [fieldLabel(key), v.length > limit ? `${v.slice(0, limit)}…` : v]);
}

function base64(text: string): string {
	let binary = "";
	for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
	return btoa(binary);
}

/** Emails the enquiry from NOTIFY_TO's own Gmail to itself; returns false when Gmail isn't configured. */
async function sendEmail(env: Env, enquiry: Enquiry): Promise<boolean> {
	if (!env.GMAIL_CLIENT_ID || !env.GMAIL_CLIENT_SECRET || !env.GMAIL_REFRESH_TOKEN) return false;
	const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		body: new URLSearchParams({
			client_id: env.GMAIL_CLIENT_ID,
			client_secret: env.GMAIL_CLIENT_SECRET,
			refresh_token: env.GMAIL_REFRESH_TOKEN,
			grant_type: "refresh_token",
		}),
	});
	const token = (await tokenRes.json().catch(() => null)) as { access_token?: string; error?: string } | null;
	if (!token?.access_token) throw new Error(`Google token ${tokenRes.status}: ${token?.error ?? "no response body"}`);

	const body = [
		`New website enquiry: ${enquiry.form}`,
		`Page: ${SITE_ORIGIN}${enquiry.page}`,
		"",
		...details(enquiry).map(([label, v]) => `${label}: ${v}`),
	].join("\r\n");
	const headers = [
		`From: "GLC Web Solutions website" <${NOTIFY_TO}>`,
		`To: ${NOTIFY_TO}`,
		...(EMAIL_RE.test(enquiry.email) ? [`Reply-To: ${enquiry.email}`] : []),
		`Subject: =?UTF-8?B?${base64(`Website enquiry: ${enquiry.form} from ${enquiry.name.slice(0, 80)}`)}?=`,
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"Content-Transfer-Encoding: base64",
	];
	const mime = `${headers.join("\r\n")}\r\n\r\n${base64(body).replace(/.{76}/g, "$&\r\n")}`;
	const raw = base64(mime).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
	const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
		method: "POST",
		headers: { authorization: `Bearer ${token.access_token}`, "content-type": "application/json" },
		body: JSON.stringify({ raw }),
	});
	if (!res.ok) throw new Error(`Gmail ${res.status}: ${await res.text()}`);
	return true;
}

/** Posts the enquiry to the Google Chat space; returns false when the webhook isn't configured. */
async function sendChat(env: Env, enquiry: Enquiry): Promise<boolean> {
	if (!env.GOOGLE_CHAT_WEBHOOK_URL) return false;
	const limit = Math.floor(CHAT_BUDGET / Math.max(1, Object.keys(enquiry.fields).length));
	const text = [
		`*New website enquiry: ${enquiry.form}*`,
		`Page: ${SITE_ORIGIN}${enquiry.page}`,
		...details(enquiry, limit).map(([label, v]) => `*${label}:* ${v}`),
	].join("\n");
	const res = await fetch(env.GOOGLE_CHAT_WEBHOOK_URL, {
		method: "POST",
		headers: { "content-type": "application/json; charset=UTF-8" },
		body: JSON.stringify({ text }),
	});
	if (!res.ok) throw new Error(`Google Chat ${res.status}: ${await res.text()}`);
	return true;
}

export const POST: APIRoute = async ({ request }) => {
	const { env } = (await import("cloudflare:workers")) as unknown as { env: Env };
	const data = await request.formData();
	const formId = String(data.get("_wpcf7") ?? "");
	const spec = FORMS[formId];
	if (!spec) return json({ status: "failed", message: "Unknown form." }, 400);

	if (String(data.get("_wpcf7_ak_hp_textarea") ?? "").trim()) {
		return json({ status: "mail_sent" });
	}

	const value = (key: string) => String(data.get(key) ?? "").trim();
	const invalid: Record<string, string> = {};
	if (!value(spec.name)) invalid[spec.name] = "Please fill out this field.";
	if (!EMAIL_RE.test(value(spec.email))) invalid[spec.email] = "Please enter an email address.";
	if (!value(spec.message)) invalid[spec.message] = "Please fill out this field.";
	if (value("your-path").toLowerCase().includes("redesign") && !value("your-website")) {
		invalid["your-website"] = "Please enter your current website address.";
	}
	if (value("acceptance-contact") !== "1") invalid["acceptance-contact"] = "Please accept to continue.";
	for (const [key, v] of data.entries()) {
		if (typeof v === "string" && v.length > 5000) invalid[key] = "This field is too long.";
	}
	if (Object.keys(invalid).length) {
		return json({ status: "validation_failed", message: "One or more fields have an error. Please check and try again.", invalid }, 422);
	}

	const ip = request.headers.get("cf-connecting-ip");
	if (env.TURNSTILE_SECRET_KEY) {
		const token = value("cf-turnstile-response");
		if (!token || !(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip))) {
			return json({ status: "spam", message: "We couldn't verify your submission. Please try again." }, 403);
		}
	}

	await env.DB.prepare(
		`CREATE TABLE IF NOT EXISTS glc_enquiries (
			id TEXT PRIMARY KEY, created_at TEXT NOT NULL, form TEXT NOT NULL, page TEXT, name TEXT, email TEXT,
			message TEXT, fields TEXT NOT NULL, ip_hash TEXT, country TEXT, emailed INTEGER NOT NULL DEFAULT 0)`,
	).run();

	const ipHash = ip ? await sha256(`${ip}:${new Date().toISOString().slice(0, 10)}`) : null;
	if (ipHash) {
		const recent = await env.DB.prepare(
			`SELECT COUNT(*) AS n FROM glc_enquiries WHERE ip_hash = ? AND created_at > datetime('now', ?)`,
		)
			.bind(ipHash, `-${WINDOW_MINUTES} minutes`)
			.first<{ n: number }>();
		if ((recent?.n ?? 0) >= MAX_PER_WINDOW) {
			return json({ status: "failed", message: "Too many submissions. Please try again later or call us." }, 429);
		}
	}

	const fields: Record<string, string> = {};
	for (const [key, v] of data.entries()) {
		if (typeof v === "string" && !key.startsWith("_") && key !== "cf-turnstile-response" && v.trim()) fields[key] = v.trim();
	}
	const page = new URL(request.headers.get("referer") || "/", request.url).pathname;
	const id = crypto.randomUUID();
	await env.DB.prepare(
		`INSERT INTO glc_enquiries (id, created_at, form, page, name, email, message, fields, ip_hash, country)
		 VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)`,
	)
		.bind(id, spec.label, page, value(spec.name), value(spec.email), value(spec.message), JSON.stringify(fields), ipHash,
			request.headers.get("cf-ipcountry"))
		.run();

	const enquiry = { form: spec.label, page, name: value(spec.name), email: value(spec.email), fields };
	const [email, chat] = await Promise.allSettled([sendEmail(env, enquiry), sendChat(env, enquiry)]);
	if (email.status === "rejected") console.error("enquiry email failed", email.reason);
	if (chat.status === "rejected") console.error("enquiry chat notification failed", chat.reason);
	if (email.status === "fulfilled" && email.value) {
		await env.DB.prepare("UPDATE glc_enquiries SET emailed = 1 WHERE id = ?").bind(id).run().catch((err) => {
			console.error("enquiry emailed flag not saved", err);
		});
	}

	return json({ status: "mail_sent", message: "Thank you for your message. It has been sent." });
};
