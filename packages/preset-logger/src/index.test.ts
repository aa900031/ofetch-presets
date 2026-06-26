import { describe, expect, it, vi } from 'vitest'
import { logger } from './index'

function sink() {
	return { log: vi.fn(), error: vi.fn() }
}

function context(status?: number, error?: Error): any {
	return {
		request: 'http://example.test/users',
		options: { method: 'GET', headers: new Headers() },
		response: status != null ? { status } : undefined,
		error,
	}
}

describe('logger', () => {
	it('passes a typed event object with timing to a custom format', () => {
		const events: any[] = []
		const preset = logger({
			logger: sink(),
			format: (e) => {
				events.push(e)
				return 'LINE'
			},
		})
		const ctx = context(200)

		preset.options.onRequest(ctx)
		preset.options.onResponse(ctx)

		expect(events).toHaveLength(2)
		expect(events[0]).toMatchObject({ type: 'request', context: ctx })
		expect(events[0].responseAt).toBeUndefined()
		expect(typeof events[0].requestAt).toBe('number')
		expect(events[1]).toMatchObject({ type: 'response', context: ctx })
		expect(typeof events[1].responseAt).toBe('number')
		expect(events[1].responseAt).toBeGreaterThanOrEqual(events[1].requestAt)
	})

	it('logs → on request and ← on a successful response', () => {
		const s = sink()
		const preset = logger({ logger: s })
		const ctx = context(200)

		preset.options.onRequest(ctx)
		preset.options.onResponse(ctx)

		expect(s.error).not.toHaveBeenCalled()
		expect(s.log).toHaveBeenCalledTimes(2)
		expect(s.log.mock.calls[0][0]).toBe('→ GET http://example.test/users')
		expect(s.log.mock.calls[1][0]).toMatch(/^← 200 GET http:\/\/example\.test\/users \(\d+ms\)$/)
	})

	it('logs an error response once via error and suppresses the success line', () => {
		const s = sink()
		const preset = logger({ logger: s })
		const ctx = context(500)

		preset.options.onRequest(ctx)
		preset.options.onResponse(ctx) // 'response' default returns undefined for >= 400
		preset.options.onResponseError(ctx)

		expect(s.log).toHaveBeenCalledTimes(1) // only the → request line
		expect(s.error).toHaveBeenCalledOnce()
		expect(s.error.mock.calls[0][0]).toContain('✗ 500')
	})

	it('logs a request (network) error via error', () => {
		const s = sink()
		const preset = logger({ logger: s })
		const ctx = context(undefined, new Error('boom'))

		preset.options.onRequest(ctx)
		preset.options.onRequestError(ctx)

		expect(s.error).toHaveBeenCalledOnce()
		expect(s.error.mock.calls[0][0]).toContain('request failed: boom')
	})

	it('skips logging when format returns undefined', () => {
		const s = sink()
		const preset = logger({ logger: s, format: () => undefined })
		const ctx = context(200)

		preset.options.onRequest(ctx)
		preset.options.onResponse(ctx)

		expect(s.log).not.toHaveBeenCalled()
		expect(s.error).not.toHaveBeenCalled()
	})
})
