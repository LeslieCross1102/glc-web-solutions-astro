#!/usr/bin/env node
/**
 * Print layout-shift entries (with the shifted nodes and their before/after rects) for a page.
 *   node scripts/cls-debug.mjs <url> [width=1350] [height=940]
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9334;
const [url, width = "1350", height = "940"] = process.argv.slice(2);

const chrome = spawn(CHROME, [
	"--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${PORT}`,
	`--user-data-dir=${path.join(ROOT, ".lighthouse/chrome-profile-cls")}`, "about:blank",
], { stdio: "ignore" });

let version;
for (let i = 0; i < 50 && !version; i++) {
	try {
		version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
	} catch {
		await new Promise((r) => setTimeout(r, 200));
	}
}

const ws = new WebSocket(version.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
	const msg = JSON.parse(ev.data);
	if (msg.id && pending.has(msg.id)) {
		const { resolve, reject } = pending.get(msg.id);
		pending.delete(msg.id);
		msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
	}
};
await new Promise((r) => (ws.onopen = r));
const send = (method, params = {}, sessionId) =>
	new Promise((resolve, reject) => {
		const msgId = ++id;
		pending.set(msgId, { resolve, reject });
		ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
	});

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Network.enable", {}, sessionId);
await send("Network.setCacheDisabled", { cacheDisabled: true }, sessionId);
await send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 100_000 }, sessionId);
await send("Emulation.setDeviceMetricsOverride", { width: +width, height: +height, deviceScaleFactor: 1, mobile: +width < 700 }, sessionId);
await send("Page.addScriptToEvaluateOnNewDocument", {
	source: `window.__shifts = [];
	new PerformanceObserver((list) => {
		for (const e of list.getEntries()) {
			window.__shifts.push({
				value: +e.value.toFixed(4), t: Math.round(e.startTime),
				sources: e.sources.map((s) => {
					const n = s.node;
					const label = n ? (n.nodeType === 1 ? n.tagName.toLowerCase() + (n.id ? "#" + n.id : "") + (n.className && typeof n.className === "string" ? "." + n.className.trim().split(/\\s+/).join(".") : "") : "#text:" + (n.textContent || "").slice(0, 40)) : "?";
					const r = (x) => [x.x, x.y, x.width, x.height].map(Math.round).join(",");
					return label + "  " + r(s.previousRect) + " -> " + r(s.currentRect);
				}),
			});
		}
	}).observe({ type: "layout-shift", buffered: true });`,
}, sessionId);
await send("Page.navigate", { url }, sessionId);
await new Promise((r) => setTimeout(r, 5000));
const { result } = await send("Runtime.evaluate", { expression: "JSON.stringify(window.__shifts, null, 1)", returnByValue: true }, sessionId);
console.log(result.value);
if (process.env.EVAL) {
	const extra = await send("Runtime.evaluate", { expression: process.env.EVAL, returnByValue: true }, sessionId);
	console.log(JSON.stringify(extra.result.value));
}
ws.close();
chrome.kill();
