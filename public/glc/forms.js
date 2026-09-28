/* Submits the Contact Form 7 markup to /api/enquiry and mirrors CF7's classes/events so theme.js and the CSS behave as on WordPress. */
(function () {
	"use strict";

	var config = window.glcForms || {};
	var siteKey = config.turnstileSiteKey || "";
	var turnstileLoading = null;

	function loadTurnstile() {
		if (!siteKey) return Promise.resolve(null);
		if (turnstileLoading) return turnstileLoading;
		turnstileLoading = new Promise(function (resolve) {
			window.glcTurnstileReady = function () { resolve(window.turnstile); };
			var s = document.createElement("script");
			s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=glcTurnstileReady";
			s.async = true;
			s.onerror = function () { resolve(null); };
			document.head.appendChild(s);
		});
		return turnstileLoading;
	}

	function prepareTurnstile(form) {
		if (!siteKey || form.dataset.glcTurnstile) return;
		form.dataset.glcTurnstile = "pending";
		loadTurnstile().then(function (ts) {
			if (!ts) return;
			var holder = document.createElement("div");
			holder.className = "glc-turnstile";
			var submit = form.querySelector(".wpcf7-submit");
			var anchor = submit ? submit.closest("p") || submit : null;
			if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(holder, anchor);
			else form.appendChild(holder);
			form.dataset.glcTurnstile = ts.render(holder, { sitekey: siteKey, appearance: "interaction-only", size: "flexible" });
		});
	}

	function waitForToken(form) {
		if (!siteKey) return Promise.resolve();
		return new Promise(function (resolve) {
			var tries = 0;
			prepareTurnstile(form);
			(function check() {
				var input = form.querySelector('[name="cf-turnstile-response"]');
				if ((input && input.value) || tries++ > 70) return resolve();
				setTimeout(check, 150);
			})();
		});
	}

	function setStatus(form, status) {
		form.classList.remove("init", "submitting", "sent", "invalid", "unaccepted", "spam", "failed", "aborted");
		form.classList.add(status);
		form.setAttribute("data-status", status);
	}

	function clearErrors(form) {
		form.querySelectorAll(".wpcf7-not-valid-tip").forEach(function (el) { el.remove(); });
		form.querySelectorAll(".wpcf7-not-valid").forEach(function (el) {
			el.classList.remove("wpcf7-not-valid");
			el.setAttribute("aria-invalid", "false");
		});
	}

	function announce(form, message) {
		var wrap = form.closest(".wpcf7");
		var output = form.querySelector(".wpcf7-response-output");
		if (output) {
			output.textContent = message || "";
			output.setAttribute("aria-hidden", message ? "false" : "true");
		}
		var live = wrap && wrap.querySelector(".screen-reader-response [role='status']");
		if (live) live.textContent = message || "";
	}

	function markInvalid(form, invalid) {
		var first = null;
		Object.keys(invalid).forEach(function (name) {
			var wrap = form.querySelector('[data-name="' + name + '"]');
			var control = wrap && wrap.querySelector("input, textarea, select");
			if (!wrap) return;
			if (control) {
				control.classList.add("wpcf7-not-valid");
				control.setAttribute("aria-invalid", "true");
				first = first || control;
			}
			var tip = document.createElement("span");
			tip.className = "wpcf7-not-valid-tip";
			tip.setAttribute("aria-hidden", "true");
			tip.textContent = invalid[name];
			wrap.appendChild(tip);
		});
		if (first) first.focus();
	}

	function clientErrors(form) {
		var invalid = {};
		form.querySelectorAll("[data-name]").forEach(function (wrap) {
			var name = wrap.getAttribute("data-name");
			var control = wrap.querySelector("input, textarea, select");
			if (!control) return;
			if (control.type === "checkbox") {
				if (wrap.querySelector(".wpcf7-acceptance") && !control.checked) invalid[name] = "Please accept to continue.";
				return;
			}
			var required = control.required || control.getAttribute("aria-required") === "true";
			var val = (control.value || "").trim();
			if (required && !val) invalid[name] = "Please fill out this field.";
			else if (val && control.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) invalid[name] = "Please enter an email address.";
			else if (val && control.type === "url" && !/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}/i.test(val)) invalid[name] = "Please enter a URL.";
		});
		return invalid;
	}

	function submit(form) {
		clearErrors(form);
		announce(form, "");
		var invalid = clientErrors(form);
		if (Object.keys(invalid).length) {
			setStatus(form, "invalid");
			markInvalid(form, invalid);
			announce(form, "One or more fields have an error. Please check and try again.");
			return;
		}
		setStatus(form, "submitting");
		waitForToken(form)
			.then(function () {
				return fetch(config.endpoint || "/api/enquiry", { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
			})
			.then(function (res) { return res.json(); })
			.then(function (data) {
				if (data.status === "mail_sent") {
					setStatus(form, "sent");
					announce(form, data.message);
					form.reset();
					form.dispatchEvent(new CustomEvent("wpcf7mailsent", { bubbles: true, detail: data }));
				} else {
					setStatus(form, data.status === "validation_failed" ? "invalid" : data.status === "spam" ? "spam" : "failed");
					if (data.invalid) markInvalid(form, data.invalid);
					announce(form, data.message);
				}
			})
			.catch(function () {
				setStatus(form, "failed");
				announce(form, "There was an error trying to send your message. Please try again later.");
			})
			.then(function () {
				var id = form.dataset.glcTurnstile;
				if (window.turnstile && id && id !== "pending") window.turnstile.reset(id);
			});
	}

	function init() {
		document.querySelectorAll("form.wpcf7-form").forEach(function (form) {
			var wrap = form.closest(".wpcf7");
			if (wrap) wrap.classList.replace("no-js", "js");
			["focusin", "pointerenter", "touchstart"].forEach(function (type) {
				form.addEventListener(type, function () { prepareTurnstile(form); }, { once: true, passive: true });
			});
			form.addEventListener("submit", function (event) {
				event.preventDefault();
				submit(form);
			});
		});
		document.addEventListener("click", function (event) {
			var button = event.target.closest && event.target.closest("[data-glc-form-reset]");
			var form = button && button.closest("form.wpcf7-form");
			if (!form) return;
			clearErrors(form);
			announce(form, "");
			setStatus(form, "init");
			form.dispatchEvent(new CustomEvent("wpcf7reset", { bubbles: true }));
		});
	}

	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
	else init();
})();
