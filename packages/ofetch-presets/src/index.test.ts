import type { Preset } from './index'
import { describe, expect, it } from 'vitest'
import { resolveOptions } from './index'

describe('resolveOptions', () => {
	describe('empty and falsy sources', () => {
		it('returns canonical resolved options for an empty source array', () => {
			const result = resolveOptions([])
			expect(result.headers).toBeInstanceOf(Headers)
			expect([...result.headers.entries()]).toEqual([])
		})

		it('ignores null, undefined, and false sources', () => {
			const result = resolveOptions([null, undefined, false])
			expect(result.headers).toBeInstanceOf(Headers)
			expect(Object.keys(result)).toEqual(['headers'])
		})

		it('ignores non-plain-object sources', () => {
			// @ts-expect-error testing runtime behaviour with invalid input types
			const result = resolveOptions(['string', 42, () => {}, [1, 2]])
			expect(result.headers).toBeInstanceOf(Headers)
			expect(Object.keys(result)).toEqual(['headers'])
		})
	})

	describe('plain option sources', () => {
		it('applies a plain option source', () => {
			const result = resolveOptions([{ baseURL: '/api' }])
			expect(result.baseURL).toBe('/api')
		})

		it('applies last-write-wins for scalar fields across sources', () => {
			const result = resolveOptions([{ baseURL: '/a' }, { baseURL: '/b' }])
			expect(result.baseURL).toBe('/b')
		})

		it('shallow-clones plain object field values', () => {
			const inner = { version: 1 }
			const result = resolveOptions([{ body: inner }])
			expect(result.body).not.toBe(inner)
			expect(result.body).toEqual(inner)
		})

		it('replaces non-hook array fields entirely from the last source', () => {
			const result = resolveOptions([
				{ retryStatusCodes: [500, 502] },
				{ retryStatusCodes: [503] },
			])
			expect(result.retryStatusCodes).toEqual([503])
		})
	})

	describe('headers', () => {
		it('canonicalizes headers to a Headers instance', () => {
			const result = resolveOptions([{ headers: { Authorization: 'Bearer token' } }])
			expect(result.headers).toBeInstanceOf(Headers)
			expect(result.headers.get('authorization')).toBe('Bearer token')
		})

		it('merges headers from multiple sources', () => {
			const result = resolveOptions([
				{ headers: { Authorization: 'Bearer token' } },
				{ headers: { 'X-Custom': 'value' } },
			])
			expect(result.headers.get('authorization')).toBe('Bearer token')
			expect(result.headers.get('x-custom')).toBe('value')
		})

		it('later source headers overwrite earlier ones for the same key', () => {
			const result = resolveOptions([
				{ headers: { Authorization: 'old' } },
				{ headers: { Authorization: 'new' } },
			])
			expect(result.headers.get('authorization')).toBe('new')
		})

		it('throws a traced error for a malformed headers init', () => {
			expect(() =>
				resolveOptions([{ headers: { 'Invalid Header Name': 'x' } }]),
			).toThrow(/\[ofetch-presets\] Invalid headers at sources\[0\]/)
		})
	})

	describe('query and params', () => {
		it('normalizes params to query', () => {
			const result = resolveOptions([{ params: { page: 1 } }])
			expect(result.query).toEqual({ page: 1 })
			expect('params' in result).toBe(false)
		})

		it('throws when params and query are both defined in the same source', () => {
			expect(() =>
				resolveOptions([{ params: { a: 1 }, query: { b: 2 } }]),
			).toThrow(/params and query/)
		})

		it('detaches the resolved query from the params source object', () => {
			const params = { page: 1 }
			const result = resolveOptions([{ params }])
			expect(result.query).not.toBe(params)
			expect(result.query).toEqual(params)
		})
	})

	describe('hooks', () => {
		it('concatenates hook arrays in source order', () => {
			const h1 = () => {}
			const h2 = () => {}
			const h3 = () => {}
			const result = resolveOptions([
				{ onRequest: [h1, h2] },
				{ onRequest: h3 },
			])
			expect(result.onRequest).toEqual([h1, h2, h3])
		})

		it('normalizes a single hook function to an array', () => {
			const h = () => {}
			const result = resolveOptions([{ onRequest: h }])
			expect(result.onRequest).toEqual([h])
		})
	})

	describe('structural presets', () => {
		it('resolves a preset with options', () => {
			const preset: Preset = { name: 'api', options: { baseURL: '/api' } }
			const result = resolveOptions([preset])
			expect(result.baseURL).toBe('/api')
		})

		it('resolves preset dependencies before the preset own options', () => {
			const dep: Preset = { name: 'base', options: { baseURL: '/base', timeout: 5000 } }
			const preset: Preset = { name: 'api', presets: [dep], options: { baseURL: '/api' } }
			const result = resolveOptions([preset])
			expect(result.baseURL).toBe('/api')
			expect(result.timeout).toBe(5000)
		})

		it('ignores extra top-level preset fields during resolution', () => {
			const preset = {
				name: 'api',
				options: { baseURL: '/api' },
				version: '1.0',
				description: 'test preset',
			}
			const result = resolveOptions([preset])
			expect(result.baseURL).toBe('/api')
			expect('version' in result).toBe(false)
			expect('description' in result).toBe(false)
		})

		it('allows repeated use of the same preset object', () => {
			const preset: Preset = { name: 'a', options: { timeout: 1000 } }
			const result = resolveOptions([preset, preset])
			expect(result.timeout).toBe(1000)
		})

		it('treats plain objects inside preset.presets as plain option sources', () => {
			const dep = { baseURL: '/from-dep' }
			const preset: Preset = { name: 'api', presets: [dep], options: { timeout: 500 } }
			const result = resolveOptions([preset])
			expect(result.baseURL).toBe('/from-dep')
			expect(result.timeout).toBe(500)
		})
	})

	describe('fail-fast validation', () => {
		it('throws for a structural preset with non-string name', () => {
			const bad = { name: 42, options: {} }
			expect(() => resolveOptions([bad as unknown as Preset])).toThrow(/name must be a string/)
		})

		it('throws for a structural preset with a non-plain-object options value', () => {
			const bad = { name: 'a', options: 'invalid' }
			// @ts-expect-error testing invalid input
			expect(() => resolveOptions([bad])).toThrow(/options must be a plain object/)
		})

		it('throws for a structural preset with a non-array presets value', () => {
			const bad = { name: 'a', presets: 'invalid' }
			// @ts-expect-error testing invalid input
			expect(() => resolveOptions([bad])).toThrow(/presets must be an array/)
		})

		it('throws on circular preset dependency with positional trace', () => {
			const a: Preset = { name: 'a', presets: [], options: {} }
			const b: Preset = { name: 'b', presets: [a], options: {} }
			a.presets = [b]
			expect(() => resolveOptions([a])).toThrow(/Circular preset dependency/)
		})
	})
})
