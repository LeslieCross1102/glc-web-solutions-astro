#!/usr/bin/env node
/**
 * Brotli-compressing proxy in front of `astro preview`, so local Lighthouse runs see
 * the same transfer sizes as Cloudflare's edge.
 *   node scripts/lh-proxy.mjs [listenPort=4341] [targetPort=4340]
 */
import http from "node:http";
import zlib from "node:zlib";

const listen = Number(process.argv[2] ?? 4341);
const target = Number(process.argv[3] ?? 4340);
const COMPRESSIBLE = /text\/|javascript|json|xml|svg|css/;

http
	.createServer((req, res) => {
		const upstream = http.request(
			{ host: "localhost", port: target, path: req.url, method: req.method, headers: { ...req.headers, "accept-encoding": "identity" } },
			(up) => {
				const headers = { ...up.headers };
				const type = String(headers["content-type"] ?? "");
				const wantsBr = /\bbr\b/.test(String(req.headers["accept-encoding"] ?? ""));
				if (wantsBr && COMPRESSIBLE.test(type) && !headers["content-encoding"]) {
					delete headers["content-length"];
					headers["content-encoding"] = "br";
					headers.vary = "Accept-Encoding";
					res.writeHead(up.statusCode ?? 200, headers);
					up.pipe(zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })).pipe(res);
				} else {
					res.writeHead(up.statusCode ?? 200, headers);
					up.pipe(res);
				}
			},
		);
		upstream.on("error", () => {
			res.writeHead(502);
			res.end();
		});
		req.pipe(upstream);
	})
	.listen(listen, () => console.log(`proxy :${listen} → :${target} (brotli)`));
