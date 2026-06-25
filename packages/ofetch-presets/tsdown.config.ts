import { lib } from '@aa900031/tsdown-config'

export default lib({
	entry: ['src/index.ts', 'src/kit.ts'],
}, {
	format: ['esm', 'cjs'],
})
