import type { APIRoute } from "astro";

export const prerender = false;

interface Env {
	DB: D1Database;
	/** FormSubmit's random alias for NOTIFY_TO, issued after activation, so the address isn't used in requests */
	FORMSUBMIT_ALIAS?: string;
	TURNSTILE_SECRET_KEY?: string;
}

const FORMS: Record<string, { label: string; name: string; email: string; message: string }> = {
	"73": { label: "Contact form", name: "text-your-name", email: "email-your-email", message: "textarea-your-message" },
	"4297": { label: "Special offer", name: "your-name", email: "your-email", message: "your-brief" },
};
const NOTIFY_TO = "gareth@glcwebsolutions.co.uk";
/** FormSubmit ties activation to the requesting site, so every version posts as the live domain */
const SITE_ORIGIN = "https://glcwebsolutions.co.uk";
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

/** Emails the enquiry to NOTIFY_TO through FormSubmit (formsubmit.co), leaving the domain's own mail setup alone. */
async function notify(env: Env, enquiry: Enquiry): Promise<void> {
	const details: Record<string, string> = {};
	for (const [key, v] of Object.entries(enquiry.fields)) {
		if (!key.startsWith("acceptance-")) details[fieldLabel(key)] = v;
	}
	const request = new Request(`https://formsubmit.co/ajax/${env.FORMSUBMIT_ALIAS || NOTIFY_TO}`, {
		method: "POST",
		headers: { "content-type": "application/json", accept: "application/json" },
		body: JSON.stringify({
			Form: enquiry.form,
			Page: `${SITE_ORIGIN}${enquiry.page}`,
			...details,
			_subject: `Website enquiry: ${enquiry.form} from ${enquiry.name}`,
			_replyto: enquiry.email,
			_template: "table",
			_captcha: "false",
		}),
	});
	request.headers.set("origin", SITE_ORIGIN);
	request.headers.set("referer", `${SITE_ORIGIN}${enquiry.page}`);
	const res = await fetch(request);
	const result = (await res.json().catch(() => null)) as { success?: boolean | string; message?: string } | null;
	if (String(result?.success) !== "true") {
		throw new Error(`FormSubmit ${res.status}: ${result?.message ?? "no response body"}`);
	}
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
		await notify(env, { form: spec.label, page, name: value(spec.name), email: value(spec.email), fields });
		await env.DB.prepare("UPDATE glc_enquiries SET emailed = 1 WHERE id = ?").bind(id).run();
	} catch (err) {
		console.error("enquiry notification failed", err);
	}

	return json({ status: "mail_sent", message: "Thank you for your message. It has been sent." });
};
