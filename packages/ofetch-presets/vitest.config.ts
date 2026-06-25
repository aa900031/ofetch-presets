import { fileURLToPath, URL } from 'node:url'
import { defineProject } from 'vitest/config'

export default defineProject({
	test: {
		include: [
			'**/*.{test,spec}.ts',
		],
		benchmark: {
			include: [],
		},
	},
	resolve: {
		alias: {
			'ofetch-presets': fileURLToPath(new URL('../../packages/ofetch-presets/src', import.meta.url)),
			'ofetch-presets/kit': fileURLToPath(new URL('../../packages/ofetch-presets/src/kit.ts', import.meta.url)),
			'ofetch-preset-xsrf-token': fileURLToPath(new URL('../../packages/preset-xsrf-token/src', import.meta.url)),
		},
	},
})
