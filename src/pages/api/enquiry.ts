import type { APIRoute } from "astro";

export const prerender = false;

interface Env {
	DB: D1Database;
	/** send_email binding — add once the domain's email is set up on Cloudflare */
	ENQUIRY_EMAIL?: { send(message: unknown): Promise<void> };
	ENQUIRY_TO?: string;
	ENQUIRY_FROM?: string;
	TURNSTILE_SECRET_KEY?: string;
}

const FORMS: Record<string, { label: string; name: string; email: string; message: string }> = {
	"73": { label: "Contact form", name: "text-your-name", email: "email-your-email", message: "textarea-your-message" },
	"4297": { label: "Special offer", name: "your-name", email: "your-email", message: "your-brief" },
};
const DEFAULT_TO = "gareth@glcwebsolutions.co.uk";
const DEFAULT_FROM = "website@glcwebsolutions.co.uk";
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

function mime(from: string, to: string, replyTo: string, subject: string, text: string): string {
	const encode = (s: string) => `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(s)))}?=`;
	return [
		`From: GLC Web Solutions website <${from}>`,
		`To: ${to}`,
		`Reply-To: ${replyTo}`,
		`Subject: ${encode(subject)}`,
		`Date: ${new Date().toUTCString()}`,
		`Message-ID: <${crypto.randomUUID()}@glcwebsolutions.co.uk>`,
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=utf-8",
		"Content-Transfer-Encoding: 8bit",
		"",
		text,
	].join("\r\n");
}

async function sendEmail(env: Env, fields: Record<string, string>, form: string, email: string, page: string) {
	if (!env.ENQUIRY_EMAIL) return false;
	const { EmailMessage } = await import("cloudflare:email");
	const to = env.ENQUIRY_TO || DEFAULT_TO;
	const from = env.ENQUIRY_FROM || DEFAULT_FROM;
	const lines = Object.entries(fields).map(([k, v]) => `${k}: ${v}`);
	const text = [`New ${form} enquiry from ${page}`, "", ...lines].join("\n");
	await env.ENQUIRY_EMAIL.send(new EmailMessage(from, to, mime(from, to, email, `Website enquiry: ${form}`, text)));
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
		if (await sendEmail(env, fields, spec.label, value(spec.email), page)) {
			await env.DB.prepare("UPDATE glc_enquiries SET emailed = 1 WHERE id = ?").bind(id).run();
		}
	} catch (err) {
		console.error("enquiry email failed", err);
	}

	return json({ status: "mail_sent", message: "Thank you for your message. It has been sent." });
};
