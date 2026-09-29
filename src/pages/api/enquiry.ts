import type { APIRoute } from "astro";

export const prerender = false;

interface Env {
	DB: D1Database;
	/** Telegram bot (from @BotFather) that messages each enquiry to TELEGRAM_CHAT_ID */
	TELEGRAM_BOT_TOKEN?: string;
	TELEGRAM_CHAT_ID?: string;
	TURNSTILE_SECRET_KEY?: string;
}

const FORMS: Record<string, { label: string; name: string; email: string; message: string }> = {
	"73": { label: "Contact form", name: "text-your-name", email: "email-your-email", message: "textarea-your-message" },
	"4297": { label: "Special offer", name: "your-name", email: "your-email", message: "your-brief" },
};
const SITE_ORIGIN = "https://glcwebsolutions.co.uk";
/** Characters shared between the field values; Telegram rejects messages over 4,096 */
const TELEGRAM_BUDGET = 3500;
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
	fields: Record<string, string>;
}

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Sends the enquiry to Telegram; returns false when the bot isn't configured. */
async function notify(env: Env, enquiry: Enquiry): Promise<boolean> {
	if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return false;
	const lines = [`<b>New website enquiry: ${escapeHtml(enquiry.form)}</b>`, `<b>Page:</b> ${escapeHtml(SITE_ORIGIN + enquiry.page)}`];
	const entries = Object.entries(enquiry.fields).filter(([key]) => !key.startsWith("acceptance-"));
	const limit = Math.floor(TELEGRAM_BUDGET / Math.max(1, entries.length));
	for (const [key, v] of entries) {
		lines.push(`<b>${escapeHtml(fieldLabel(key))}:</b> ${escapeHtml(v.length > limit ? `${v.slice(0, limit)}…` : v)}`);
	}
	const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: lines.join("\n"), parse_mode: "HTML", link_preview_options: { is_disabled: true } }),
	});
	const result = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
	if (!result?.ok) throw new Error(`Telegram ${res.status}: ${result?.description ?? "no response body"}`);
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

	try {
		if (await notify(env, { form: spec.label, page, fields })) {
			await env.DB.prepare("UPDATE glc_enquiries SET emailed = 1 WHERE id = ?").bind(id).run();
		}
	} catch (err) {
		console.error("enquiry notification failed", err);
	}

	return json({ status: "mail_sent", message: "Thank you for your message. It has been sent." });
};
