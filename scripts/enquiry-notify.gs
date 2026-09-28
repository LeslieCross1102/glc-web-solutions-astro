/**
 * Google Apps Script web app that emails website enquiries from the GLC Google Workspace account.
 * src/pages/api/enquiry.ts POSTs each enquiry here as JSON; the URL is the Worker secret ENQUIRY_WEBHOOK_URL.
 *
 * Setup: script.google.com → New project → paste this file → Deploy → New deployment → Web app,
 * Execute as "Me", Who has access "Anyone" → authorise → copy the web app URL.
 * After editing, redeploy via Deploy → Manage deployments → edit → New version (the URL stays the same).
 */
const TO = "gareth@glcwebsolutions.co.uk";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function doPost(e) {
	const enquiry = JSON.parse(e.postData.contents);
	const fields = enquiry.fields || {};
	const lines = Object.keys(fields).map((key) => key + ": " + fields[key]);
	const message = {
		to: TO,
		name: "GLC Web Solutions website",
		subject: "Website enquiry: " + enquiry.form + (enquiry.name ? " from " + enquiry.name : ""),
		body: ["New " + enquiry.form + " enquiry from " + enquiry.page, ""].concat(lines).join("\n"),
	};
	if (EMAIL_RE.test(enquiry.email || "")) message.replyTo = enquiry.email;
	MailApp.sendEmail(message);
	return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
