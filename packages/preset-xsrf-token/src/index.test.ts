import { afterEach, describe, expect, it } from 'vitest'
import { xsrfToken } from './index'

function fakeContext(headers = new Headers()): any {
	return { request: '/x', options: { headers } }
}

describe('xsrfToken', () => {
	it('sets `X-XSRF-TOKEN` from the token by default', async () => {
		const preset = xsrfToken({ getToken: () => 'abc' })
		const ctx = fakeContext()
		await preset.options.onRequest(ctx)
		expect(ctx.options.headers.get('x-xsrf-token')).toBe('abc')
	})

	it('skips the header when the token is falsy', async () => {
		const preset = xsrfToken({ getToken: () => '' })
		const ctx = fakeContext()
		await preset.options.onRequest(ctx)
		expect(ctx.options.headers.has('x-xsrf-token')).toBe(false)
	})

	it('honours custom cookieName and headerName', async () => {
		let seenCookieName: string | undefined
		const preset = xsrfToken({
			cookieName: 'MY-COOKIE',
			headerName: 'X-My-Header',
			getToken: ({ cookieName }) => {
				seenCookieName = cookieName
				return 't'
			},
		})
		const ctx = fakeContext()
		await preset.options.onRequest(ctx)
		expect(seenCookieName).toBe('MY-COOKIE')
		expect(ctx.options.headers.get('x-my-header')).toBe('t')
	})

	it('deletes `X-CSRF-TOKEN` by default', async () => {
		const preset = xsrfToken({ getToken: () => 't' })
		const headers = new Headers({ 'X-CSRF-TOKEN': 'stale' })
		const ctx = fakeContext(headers)
		await preset.options.onRequest(ctx)
		expect(ctx.options.headers.has('x-csrf-token')).toBe(false)
	})

	it('keeps the clean-up header when cleanCsrfHeader is false', async () => {
		const preset = xsrfToken({ cleanCsrfHeader: false, getToken: () => 't' })
		const headers = new Headers({ 'X-CSRF-TOKEN': 'stale' })
		const ctx = fakeContext(headers)
		await preset.options.onRequest(ctx)
		expect(ctx.options.headers.get('x-csrf-token')).toBe('stale')
	})

	it('deletes a custom header when cleanCsrfHeader is a string', async () => {
		const preset = xsrfToken({ cleanCsrfHeader: 'X-Other', getToken: () => 't' })
		const headers = new Headers({ 'X-Other': 'stale', 'X-CSRF-TOKEN': 'kept' })
		const ctx = fakeContext(headers)
		await preset.options.onRequest(ctx)
		expect(ctx.options.headers.has('x-other')).toBe(false)
		expect(ctx.options.headers.get('x-csrf-token')).toBe('kept')
	})

	describe('defaultGetToken', () => {
		afterEach(() => {
			delete (globalThis as any).window
		})

		it('reads the cookie from the browser document', async () => {
			;(globalThis as any).window = { document: { cookie: 'XSRF-TOKEN=from-cookie; other=1' } }
			const preset = xsrfToken()
			const ctx = fakeContext()
			await preset.options.onRequest(ctx)
			expect(ctx.options.headers.get('x-xsrf-token')).toBe('from-cookie')
		})

		it('does nothing when there is no document cookie', async () => {
			const preset = xsrfToken()
			const ctx = fakeContext()
			await preset.options.onRequest(ctx)
			expect(ctx.options.headers.has('x-xsrf-token')).toBe(false)
		})
	})
})
