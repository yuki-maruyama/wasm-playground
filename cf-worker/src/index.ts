/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import "./tinygo_wasm_exec"
// @ts-expect-error
import module from "../../go/tinygo.main.wasm";

// @ts-expect-error
const go = new Go()
WebAssembly.instantiate(module, go.importObject).then((instance) => {
	go.run(instance);
}).catch((err) => {
	console.error(err);
});

declare global {
	function generateMandelbrot(width: number, height: number): string;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method !== 'GET') {
			return new Response(null, { status: 405 });
		}
		const path = new URL(request.url).pathname;
		const params = new URL(request.url).searchParams;
		const width = Number(params.get('width')) || 160;
		const height = Number(params.get('height')) || 48;
		if (path === '/go') {
			const start = Date.now();
			const art = generateMandelbrot(width, height);
			const end = Date.now();
			const res = {
				"art": art,
				"time": end - start,
			}
			return new Response(JSON.stringify(res));
		}
		if (path === '/js') {
			const start = Date.now();
			const art = generateMandelbrotJS(width, height);
			const end = Date.now();
			const res = {
				"art": art,
				"time": end - start,
			}
			return new Response(JSON.stringify(res));
		}
		return new Response(null, { status: 404 });
	},
} satisfies ExportedHandler<Env>;

function mandelbrot(c_re: number, c_im: number): number {
	const iterations = 1000;
	const escapeRadius = 2.0;
	let z_re = 0, z_im = 0;
	let z_re_squared = 0, z_im_squared = 0;

	for (let n = 0; n < iterations; n++) {
		z_im = 2 * z_re * z_im + c_im;
		z_re = z_re_squared - z_im_squared + c_re;
		z_re_squared = z_re * z_re;
		z_im_squared = z_im * z_im;

		if (z_re_squared + z_im_squared > escapeRadius * escapeRadius) {
			return n;
		}
	}
	return iterations;
}

function generateMandelbrotJS(width: number, height: number): string {
	const xmin = -2.0, ymin = -1.5, xmax = 1.0, ymax = 1.5;
	const dx = (xmax - xmin) / width;
	const dy = (ymax - ymin) / height;

	let art = [];

	for (let py = 0; py < height; py++) {
		const c_im = ymin + py * dy;
		let row = '';

		for (let px = 0; px < width; px++) {
			const c_re = xmin + px * dx;
			const m = mandelbrot(c_re, c_im);
			let ch;

			switch (true) {
				case m < 10:
					ch = ' ';
					break;
				case m < 20:
					ch = '.';
					break;
				case m < 40:
					ch = '*';
					break;
				case m < 100:
					ch = 'o';
					break;
				case m < 200:
					ch = 'O';
					break;
				default:
					ch = '@';
			}
			row += ch;
		}
		art.push(row);
	}
	return art.join('\n');
}

