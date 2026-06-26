import { describe, expect, it } from 'vitest'
import { retryAfter } from './index'

describe('retryAfter', () => {
	function ctxWith(value?: string): any {
		const headers = new Headers()
		if (value !== undefined)
			headers.set('Retry-After', value)
		return { request: '/x', options: { headers }, response: { headers } }
	}

	it('derives the delay from the response header', () => {
		expect(retryAfter().options.retryDelay(ctxWith('2'))).toBe(2000)
	})

	it('falls back when the header is absent', () => {
		expect(retryAfter({ fallbackDelay: 500 }).options.retryDelay(ctxWith())).toBe(500)
	})

	it('caps the delay at maxDelay', () => {
		expect(retryAfter({ maxDelay: 1000 }).options.retryDelay(ctxWith('60'))).toBe(1000)
	})
})
