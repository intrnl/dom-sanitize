import { defineConfig } from 'vite';

import dts from 'vite-plugin-dts';

export default defineConfig({
	build: {
		sourcemap: true,
		minify: false,
		lib: {
			entry: './lib/index.ts',
			formats: ['esm', 'cjs'],
			fileName: 'dom-sanitize',
		},
		rollupOptions: {
			external: [],
		},
	},
	plugins: [
		dts(),
	],
});
