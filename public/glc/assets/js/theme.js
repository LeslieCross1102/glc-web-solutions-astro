/**
 * Teal Horizon — front-end behaviour.
 *
 * Mobile navigation, the sticky header shadow, the colour scheme toggle,
 * and GTM dataLayer conversion events.
 */
(function () {
	'use strict';

	window.dataLayer = window.dataLayer || [];

	var settings = window.glcTheme || {};
	var STORAGE_KEY = settings.storageKey || 'glc-color-scheme';

	/**
	 * Mobile navigation panel.
	 */
	function initMobileNav() {
		var toggle = document.querySelector('[data-glc-nav-toggle]');
		var panel = document.querySelector('[data-glc-mobile-menu]');

		if (!toggle || !panel) {
			return;
		}

		var label = toggle.querySelector('[data-glc-toggle-label]');

		function setOpen(open) {
			toggle.setAttribute('aria-expanded', String(open));
			panel.classList.toggle('is-open', open);

			if (label) {
				label.textContent = open
					? settings.closeMenuLabel || 'Close menu'
					: settings.openMenuLabel || 'Open menu';
			}
		}

		toggle.addEventListener('click', function () {
			setOpen(toggle.getAttribute('aria-expanded') !== 'true');
		});

		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
				setOpen(false);
				toggle.focus();
			}
		});

		// Close when a link is followed so in-page anchors do not leave the
		// panel covering the target.
		panel.addEventListener('click', function (event) {
			if (event.target.closest('a')) {
				setOpen(false);
			}
		});

		// The panel is desktop-hidden by CSS; reset state so it cannot be
		// stranded open when the viewport grows.
		window.addEventListener('resize', function () {
			if (window.innerWidth >= 1024 && toggle.getAttribute('aria-expanded') === 'true') {
				setOpen(false);
			}
		});
	}

	/**
	 * Deepen the header shadow once the page has scrolled away from the top,
	 * and grow the green reading line across the bottom of the header.
	 */
	function initStickyHeader() {
		var nav = document.querySelector('[data-glc-nav]');

		if (!nav) {
			return;
		}

		var ticking = false;

		function update() {
			var doc = document.documentElement;
			var max = Math.max(doc.scrollHeight - window.innerHeight, 0);
			var progress = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;

			nav.classList.toggle('is-scrolled', window.scrollY > 8);
			nav.style.setProperty('--glc-scroll-progress', progress.toFixed(4));
			ticking = false;
		}

		function requestUpdate() {
			if (!ticking) {
				window.requestAnimationFrame(update);
				ticking = true;
			}
		}

		window.addEventListener('scroll', requestUpdate, { passive: true });
		window.addEventListener('resize', requestUpdate);
		update();
	}

	/**
	 * Colour scheme toggle.
	 *
	 * The initial class is applied by a blocking script in the head; this only
	 * handles user-initiated changes and system preference updates for
	 * visitors who have not made an explicit choice.
	 */
	function initSchemeToggle() {
		var root = document.documentElement;

		function apply(dark) {
			root.classList.toggle('dark', dark);
			root.classList.toggle('light', !dark);
		}

		var buttons = document.querySelectorAll('[data-glc-scheme-toggle]');

		Array.prototype.forEach.call(buttons, function (button) {
			button.addEventListener('click', function () {
				var dark = !root.classList.contains('dark');
				apply(dark);

				try {
					window.localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
				} catch (e) {}
			});
		});

		var query = window.matchMedia('(prefers-color-scheme: dark)');

		var onChange = function (event) {
			var stored = null;

			try {
				stored = window.localStorage.getItem(STORAGE_KEY);
			} catch (e) {}

			if (!stored) {
				apply(event.matches);
			}
		};

		if (typeof query.addEventListener === 'function') {
			query.addEventListener('change', onChange);
		} else if (typeof query.addListener === 'function') {
			query.addListener(onChange);
		}
	}

	/**
	 * Dismissible special offer banner.
	 */
	/**
	 * Homepage blog carousel — scroll the track by one card.
	 */
	function initHomeBlogCarousel() {
		var roots = document.querySelectorAll('[data-glc-blog-carousel]');

		if (!roots.length) {
			return;
		}

		roots.forEach(function (root) {
			var track = root.querySelector('[data-glc-blog-track]');
			var prev = root.querySelector('[data-glc-blog-prev]');
			var next = root.querySelector('[data-glc-blog-next]');

			if (!track || !prev || !next) {
				return;
			}

			function getStep() {
				var card = track.querySelector('[data-glc-carousel-card], .glc-home-blog-card, .glc-work-card');
				if (!card) {
					return track.clientWidth;
				}

				var styles = window.getComputedStyle(track);
				var gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
				return card.getBoundingClientRect().width + gap;
			}

			function canScroll() {
				return track.scrollWidth - track.clientWidth > 2;
			}

			function updateNav() {
				var scrollable = canScroll();

				root.classList.toggle('is-scrollable', scrollable);
				prev.disabled = !scrollable;
				next.disabled = !scrollable;
			}

			function scrollByStep(direction) {
				if (!canScroll()) {
					return;
				}

				var maxScroll = track.scrollWidth - track.clientWidth;

				if (direction > 0 && track.scrollLeft >= maxScroll - 1) {
					track.scrollTo({ left: 0, behavior: 'smooth' });
					return;
				}

				if (direction < 0 && track.scrollLeft <= 1) {
					track.scrollTo({ left: maxScroll, behavior: 'smooth' });
					return;
				}

				track.scrollBy({
					left: getStep() * direction,
					behavior: 'smooth',
				});
			}

			prev.addEventListener('click', function () {
				scrollByStep(-1);
			});

			next.addEventListener('click', function () {
				scrollByStep(1);
			});

			track.addEventListener('scroll', updateNav, { passive: true });
			window.addEventListener('resize', updateNav);
			window.addEventListener('load', updateNav);
			updateNav();
			window.requestAnimationFrame(updateNav);

			if (root.hasAttribute('data-glc-carousel-autoplay') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				window.setInterval(function () {
					if (!canScroll() || root.matches(':hover') || root.contains(document.activeElement)) {
						return;
					}

					scrollByStep(1);
				}, 4500);
			}
		});
	}

	function initOfferBanner() {
		var banner = document.querySelector('[data-glc-offer-banner]');
		var dismiss = document.querySelector('[data-glc-offer-dismiss]');
		var key = settings.offerBannerKey || 'glc-offer-banner';

		if (!banner || !dismiss) {
			return;
		}

		dismiss.addEventListener('click', function (event) {
			event.preventDefault();
			event.stopPropagation();
			banner.hidden = true;

			try {
				window.localStorage.setItem(key, '1');
			} catch (e) {}
		});
	}

	/**
	 * Contact Form 7 success panel — swap fields for thank-you + next actions.
	 */
	function initFormThanks() {
		function formSentScope(form) {
			return form.closest('.glc-cta-panel, .glc-case-contact__form, .glc-contact-form-panel');
		}

		function setFormSentState(form, isSent) {
			var scope = formSentScope(form);

			if (scope) {
				scope.classList.toggle('is-form-sent', isSent);
			}
		}

		function showThanks(form) {
			var panel = form.querySelector('[data-glc-form-thanks]');

			if (!panel) {
				return;
			}

			panel.classList.add('is-visible');
			setFormSentState(form, true);

			if (typeof panel.scrollIntoView === 'function') {
				panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		}

		function hideThanks(form) {
			var panel = form.querySelector('[data-glc-form-thanks]');

			if (!panel) {
				return;
			}

			panel.classList.remove('is-visible');
			setFormSentState(form, false);
		}

		document.addEventListener('wpcf7mailsent', function (event) {
			if (event && event.target) {
				showThanks(event.target);
			}
		});

		document.addEventListener('wpcf7reset', function (event) {
			if (event && event.target) {
				hideThanks(event.target);
			}
		});

		document.addEventListener('click', function (event) {
			var button = event.target.closest('[data-glc-form-reset]');

			if (!button) {
				return;
			}

			var form = button.closest('form.wpcf7-form');

			if (!form) {
				return;
			}

			event.preventDefault();

			if (window.wpcf7 && typeof window.wpcf7.reset === 'function') {
				window.wpcf7.reset(form);
			} else {
				form.reset();
				form.classList.remove('sent', 'invalid', 'unaccepted', 'spam', 'failed', 'aborted');
				hideThanks(form);
			}

			var firstField = form.querySelector('input:not([type="hidden"]):not([type="submit"]), textarea');
			if (firstField) {
				firstField.focus();
			}
		});
	}

	/**
	 * New website / Website redesign buttons: require a URL only for redesigns.
	 */
	function initFormPathChoice() {
		function isRedesignValue(value) {
			return /redesign/i.test(value || '');
		}

		function syncForm(form) {
			var radios = form.querySelectorAll('input[name="your-path"], input[name="your-path[]"]');
			var urlWrap = form.querySelector('[data-glc-form-url]');
			var urlInput = urlWrap ? urlWrap.querySelector('input') : null;

			if (!radios.length || !urlInput) {
				return;
			}

			var redesign = false;
			var i;

			for (i = 0; i < radios.length; i++) {
				if (radios[i].checked && isRedesignValue(radios[i].value)) {
					redesign = true;
					break;
				}
			}

			urlInput.required = redesign;
			urlInput.setAttribute('aria-required', redesign ? 'true' : 'false');

			if (!redesign) {
				urlInput.removeAttribute('required');
			}
		}

		document.querySelectorAll('form.wpcf7-form').forEach(syncForm);

		document.addEventListener('change', function (event) {
			var input = event.target;

			if (!input || !input.name || input.name.indexOf('your-path') !== 0) {
				return;
			}

			var form = input.closest('form.wpcf7-form');

			if (form) {
				syncForm(form);
			}
		});

		document.addEventListener('wpcf7reset', function (event) {
			if (event && event.target) {
				window.setTimeout(function () {
					syncForm(event.target);
				}, 0);
			}
		});
	}

	/**
	 * GA4 / GTM dataLayer conversions.
	 *
	 * Events: qualified_engagement, key_button_click, form_submission.
	 * Click handlers never call preventDefault; form tracking uses CF7's
	 * wpcf7mailsent event (fires only after a valid, successful send).
	 */
	function initDataLayerTracking() {
		window.dataLayer = window.dataLayer || [];

		function pushEvent(name, extra) {
			var payload = { event: name };

			if (extra) {
				Object.keys(extra).forEach(function (key) {
					payload[key] = extra[key];
				});
			}

			window.dataLayer.push(payload);
		}

		function pathnameFromHref(href) {
			try {
				return new URL(href, window.location.href).pathname.replace(/\/+$/, '') || '/';
			} catch (e) {
				return '';
			}
		}

		function isContactPath(pathname) {
			var configured = settings.contactUrl ? pathnameFromHref(settings.contactUrl) : '';

			if (configured && pathname === configured) {
				return true;
			}

			return /\/contact(?:s|-us)?$/i.test(pathname);
		}

		function buttonTypeFromAnchor(anchor) {
			var href = (anchor.getAttribute('href') || '').trim();

			if (!href) {
				return '';
			}

			var url;

			try {
				url = new URL(href, window.location.href);
			} catch (e) {
				return '';
			}

			if (url.protocol === 'tel:') {
				return 'phone';
			}

			var host = url.hostname.replace(/^www\./, '').toLowerCase();

			if (
				host === 'wa.me' ||
				host === 'api.whatsapp.com' ||
				host === 'whatsapp.com' ||
				host.indexOf('whatsapp.') === 0
			) {
				return 'whatsapp';
			}

			if (anchor.classList.contains('glc-button--whatsapp')) {
				return 'whatsapp';
			}

			if (isContactPath(url.pathname.replace(/\/+$/, '') || '/')) {
				return 'contact_page';
			}

			return '';
		}

		window.setTimeout(function () {
			pushEvent('qualified_engagement');
		}, 15000);

		document.addEventListener('click', function (event) {
			var anchor = event.target.closest('a[href]');

			if (!anchor) {
				return;
			}

			var buttonType = buttonTypeFromAnchor(anchor);

			if (!buttonType) {
				return;
			}

			pushEvent('key_button_click', { button_type: buttonType });
		});

		document.addEventListener('wpcf7mailsent', function (event) {
			var configuredId = parseInt(settings.contactFormId, 10) || 0;
			var sentId = 0;

			if (event && event.detail && event.detail.contactFormId) {
				sentId = parseInt(event.detail.contactFormId, 10) || 0;
			}

			if (configuredId && sentId !== configuredId) {
				return;
			}

			pushEvent('form_submission');
		});
	}

	/**
	 * Keep one feature explanation open at a time, and close on Escape.
	 */
	function initFeatureTips() {
		document.addEventListener(
			'toggle',
			function (event) {
				var opened = event.target;

				if (!opened || !opened.classList || !opened.classList.contains('glc-feature-tip') || !opened.open) {
					return;
				}

				document.querySelectorAll('.glc-feature-tip[open]').forEach(function (el) {
					if (el !== opened) {
						el.removeAttribute('open');
					}
				});
			},
			true
		);

		document.addEventListener('keydown', function (event) {
			if (event.key !== 'Escape') {
				return;
			}

			document.querySelectorAll('.glc-feature-tip[open]').forEach(function (el) {
				el.removeAttribute('open');
			});
		});
	}

	function init() {
		initMobileNav();
		initStickyHeader();
		initSchemeToggle();
		initHomeBlogCarousel();
		initOfferBanner();
		initFormThanks();
		initFormPathChoice();
		initDataLayerTracking();
		initFeatureTips();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
