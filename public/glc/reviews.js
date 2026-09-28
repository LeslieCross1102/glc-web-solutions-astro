/* "Read more" toggles for the static Google reviews widget. */
(function () {
	function init() {
		document.querySelectorAll(".ti-widget .ti-read-more").forEach(function (toggle) {
			var item = toggle.closest(".ti-inner");
			var content = item && item.querySelector(".ti-review-content");
			var label = toggle.querySelector("span");
			if (!content || !label) return;
			if (content.scrollHeight <= content.clientHeight + 2) {
				toggle.hidden = true;
				return;
			}
			label.setAttribute("role", "button");
			label.setAttribute("tabindex", "0");
			label.setAttribute("aria-expanded", "false");
			function flip() {
				var open = content.classList.toggle("is-expanded");
				label.textContent = open ? toggle.dataset.collapseText || "Hide" : toggle.dataset.openText || "Read more";
				label.setAttribute("aria-expanded", String(open));
			}
			label.addEventListener("click", flip);
			label.addEventListener("keydown", function (e) {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					flip();
				}
			});
		});
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
	else init();
})();
