import { ofetch } from 'ofetch'
import { resolveOptions } from 'ofetch-presets'
import { describe, expect, it } from 'vitest'
import { bearerToken } from './index'

function fakeContext(): any {
	return { request: '/x', options: { headers: new Headers() } }
}

describe('bearerToken', () => {
	it('sets `Authorization: Bearer <token>` by default', async () => {
		const preset = bearerToken({ getToken: () => 'abc' })
		const ctx = fakeContext()
		await preset.options.onRequest(ctx)
		expect(ctx.options.headers.get('authorization')).toBe('Bearer abc')
	})

	it('skips the header when the token is falsy', async () => {
		const preset = bearerToken({ getToken: () => undefined })
		const ctx = fakeContext()
		await preset.options.onRequest(ctx)
		expect(ctx.options.headers.has('authorization')).toBe(false)
	})

	it('omits the scheme prefix when scheme is false', async () => {
		const preset = bearerToken({ scheme: false, getToken: () => 'raw' })
		const ctx = fakeContext()
		await preset.options.onRequest(ctx)
		expect(ctx.options.headers.get('authorization')).toBe('raw')
	})

	it('awaits an async token and honours a custom header name', async () => {
		const preset = bearerToken({ headerName: 'X-Token', getToken: async () => 't' })
		const ctx = fakeContext()
		await preset.options.onRequest(ctx)
		expect(ctx.options.headers.get('x-token')).toBe('Bearer t')
	})

	describe('refresh + retry', () => {
		function errorContext(status: number, options: any): any {
			return { request: '/x', options, response: { status } }
		}

		it('adds no retry config when refresh is not provided', () => {
			const preset = bearerToken({ getToken: () => 't' })
			expect(preset.options.retry).toBeUndefined()
			expect(preset.options.onResponseError).toBeUndefined()
		})

		it('enables a single retry and keeps ofetch default retry codes', () => {
			const preset = bearerToken({ getToken: () => 't', refresh: () => {} })
			expect(preset.options.retry).toBe(1)
			expect(preset.options.retryStatusCodes).toContain(401)
		})

		it('refreshes on 401, then re-applies the rotated token on the retry', async () => {
			const tokens = ['old', 'new']
			let i = 0
			const preset = bearerToken({ getToken: () => tokens[i], refresh: () => i++ })
			const options = { headers: new Headers() }

			await preset.options.onRequest({ request: '/x', options } as any)
			expect(options.headers.get('authorization')).toBe('Bearer old')

			await preset.options.onResponseError!(errorContext(401, options))

			await preset.options.onRequest({ request: '/x', options } as any)
			expect(options.headers.get('authorization')).toBe('Bearer new')
		})

		it('refreshes at most once, even across the retry (options is spread)', async () => {
			let calls = 0
			const preset = bearerToken({ getToken: () => 't', refresh: () => calls++ })
			const options = { headers: new Headers() }

			await preset.options.onResponseError!(errorContext(401, options))
			// ofetch recurses with `{ ...context.options }` on retry — the guard must survive the spread.
			await preset.options.onResponseError!(errorContext(401, { ...options }))

			expect(calls).toBe(1)
		})

		it('ignores statuses outside refreshStatusCodes', async () => {
			let calls = 0
			const preset = bearerToken({ getToken: () => 't', refresh: () => calls++ })
			await preset.options.onResponseError!(errorContext(500, { headers: new Headers() }))
			expect(calls).toBe(0)
		})

		it('drives a real 401 → refresh → retry through ofetch without mutating the shared options', async () => {
			const tokens = ['old', 'new']
			let i = 0
			let refreshCount = 0
			const preset = bearerToken({
				getToken: () => tokens[i],
				refresh: () => {
					refreshCount++
					i++
				},
			})
			// The object a consumer would reuse across many requests.
			const sharedOptions = resolveOptions([preset])

			const seen: (string | null)[] = []
			let attempt = 0
			const fetch = (async (_request: any, options: any) => {
				seen.push(options.headers.get('authorization'))
				attempt++
				const status = attempt === 1 ? 401 : 200
				return new Response(JSON.stringify({ ok: status === 200 }), {
					status,
					headers: { 'content-type': 'application/json' },
				})
			}) as any
			const api = ofetch.create({}, { fetch })

			await api('http://example.test/me', sharedOptions as any)

			expect(seen).toEqual(['Bearer old', 'Bearer new'])
			expect(refreshCount).toBe(1)
			// The guard never lands on the caller's object — so a second request refreshes again.
			expect(Object.getOwnPropertySymbols(sharedOptions)).toHaveLength(0)
		})
	})
})
