#!/usr/bin/env node
/**
 * Measure the rendered CSS width of every <img> on every rendered page at four viewport widths,
 * using headless Chrome over the DevTools protocol. Output feeds the srcset/sizes step in
 * scripts/optimise.mjs.
 *   node scripts/measure-images.mjs [origin=http://localhost:4340]
 * Writes src/generated/image-sizes.json:
 *   { pages: { "<page key>": { "<img src>": [[w@412, w@768, w@1024, w@1350], …one per occurrence] } },
 *     global: { "<img src>": [max w@412, …] } }
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = (process.argv[2] ?? "http://localhost:4340").replace(/\/$/, "");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WIDTHS = [412, 768, 1024, 1350];
const PORT = 9333;

const manifest = JSON.parse(await fs.readFile(path.join(ROOT, "src/rendered/manifest.json"), "utf8"));
const routeByKey = new Map();
for (const [route, page] of Object.entries(manifest)) {
	if (!routeByKey.has(page.key)) routeByKey.set(page.key, route);
}

const chrome = spawn(CHROME, [
	"--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${PORT}`,
	`--user-data-dir=${path.join(ROOT, ".lighthouse/chrome-profile")}`, "about:blank",
], { stdio: "ignore" });

async function waitForChrome() {
	for (let i = 0; i < 50; i++) {
		try {
			return await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
		} catch {
			await new Promise((r) => setTimeout(r, 200));
		}
	}
	throw new Error("Chrome did not start");
}

function connect(url) {
	const ws = new WebSocket(url);
	let id = 0;
	const pending = new Map();
	const listeners = new Set();
	ws.onmessage = (ev) => {
		const msg = JSON.parse(ev.data);
		if (msg.id && pending.has(msg.id)) {
			const { resolve, reject } = pending.get(msg.id);
			pending.delete(msg.id);
			msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
		} else listeners.forEach((fn) => fn(msg));
	};
	const ready = new Promise((r) => (ws.onopen = r));
	return {
		ready,
		send(method, params = {}, sessionId) {
			return new Promise((resolve, reject) => {
				const msgId = ++id;
				const timer = setTimeout(() => {
					pending.delete(msgId);
					reject(new Error(`${method} timed out`));
				}, 20000);
				pending.set(msgId, {
					resolve: (v) => (clearTimeout(timer), resolve(v)),
					reject: (e) => (clearTimeout(timer), reject(e)),
				});
				ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
			});
		},
		on: (fn) => listeners.add(fn),
		off: (fn) => listeners.delete(fn),
		close: () => ws.close(),
	};
}

const COLLECT = `(() => {
	const out = {};
	for (const img of document.images) {
		const src = img.getAttribute("src");
		if (!src || !src.startsWith("/glc/")) continue;
		(out[src] ??= []).push(Math.ceil(img.getBoundingClientRect().width));
	}
	return out;
})()`;

async function measureRoute(cdp, sessionId, route, width) {
	await cdp.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 700 }, sessionId);
	let fn;
	const loaded = new Promise((resolve) => {
		fn = (msg) => {
			if (msg.sessionId === sessionId && msg.method === "Page.loadEventFired") resolve();
		};
		cdp.on(fn);
		setTimeout(resolve, 8000);
	}).finally(() => cdp.off(fn));
	await cdp.send("Page.navigate", { url: ORIGIN + route }, sessionId);
	await loaded;
	const { result } = await cdp.send("Runtime.evaluate", { expression: COLLECT, returnByValue: true }, sessionId);
	return result.value;
}

const watchdog = setTimeout(() => {
	console.error("measure-images: gave up after 15 minutes");
	chrome.kill();
	process.exit(1);
}, 15 * 60 * 1000);
watchdog.unref();

try {
	const { webSocketDebuggerUrl } = await waitForChrome();
	const cdp = connect(webSocketDebuggerUrl);
	await cdp.ready;
	const pages = {};
	const global = {};
	const queue = [...routeByKey].flatMap(([key, route]) => WIDTHS.map((width, i) => ({ key, route, width, i })));
	const total = queue.length;
	await Promise.all(Array.from({ length: 4 }, async () => {
		const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
		const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
		await cdp.send("Page.enable", {}, sessionId);
		while (queue.length) {
			const { key, route, width, i } = queue.shift();
			let found = null;
			for (let attempt = 0; attempt < 2 && !found; attempt++) {
				found = await measureRoute(cdp, sessionId, route, width).catch((err) => {
					console.warn(`skip ${route} @${width}: ${err.message}`);
					return null;
				});
			}
			if (!found) continue;
			const page = (pages[key] ??= {});
			for (const [src, widths] of Object.entries(found)) {
				const slots = (page[src] ??= []);
				widths.forEach((w, n) => {
					(slots[n] ??= [0, 0, 0, 0])[i] = w;
				});
				global[src] ??= [0, 0, 0, 0];
				global[src][i] = Math.max(global[src][i], ...widths);
			}
			if (queue.length % 100 === 0) console.log(`measured ${total - queue.length}/${total}`);
		}
	}));
	const sortKeys = (obj) => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
	const out = {
		pages: sortKeys(Object.fromEntries(Object.entries(pages).map(([k, v]) => [k, sortKeys(v)]))),
		global: sortKeys(global),
	};
	await fs.mkdir(path.join(ROOT, "src/generated"), { recursive: true });
	await fs.writeFile(path.join(ROOT, "src/generated/image-sizes.json"), JSON.stringify(out) + "\n");
	console.log(`images: ${Object.keys(global).length} measured across ${routeByKey.size} pages`);
	cdp.close();
} finally {
	chrome.kill();
}
