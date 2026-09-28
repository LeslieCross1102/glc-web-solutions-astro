/* YouTube facades: swap the poster button for the real embed when it nears the viewport or is clicked. */
(function () {
	document.querySelectorAll("[data-glc-yt]").forEach(function (button) {
		var loaded = false;
		function load() {
			if (loaded) return;
			loaded = true;
			var frame = document.createElement("iframe");
			frame.src = button.getAttribute("data-glc-yt");
			frame.title = button.getAttribute("data-title") || "YouTube video";
			frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
			frame.allowFullscreen = true;
			frame.referrerPolicy = "strict-origin-when-cross-origin";
			button.replaceWith(frame);
		}
		button.addEventListener("click", load);
		if ("IntersectionObserver" in window) {
			var observer = new IntersectionObserver(function (entries) {
				if (entries.some(function (e) { return e.isIntersecting; })) {
					observer.disconnect();
					load();
				}
			}, { rootMargin: "200px 0px" });
			observer.observe(button);
		}
	});
})();
