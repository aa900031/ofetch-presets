import { describe, expect, it } from 'vitest'
import { parseRetryAfter } from './parse'

describe('parseRetryAfter', () => {
	it('parses delay-seconds to milliseconds', () => {
		expect(parseRetryAfter('120', 0)).toBe(120000)
		expect(parseRetryAfter('0', 0)).toBe(0)
	})

	it('parses an HTTP-date relative to now', () => {
		const now = Date.parse('Wed, 21 Oct 2015 07:28:00 GMT')
		expect(parseRetryAfter('Wed, 21 Oct 2015 07:28:10 GMT', now)).toBe(10000)
	})

	it('clamps a past date to 0', () => {
		const now = Date.parse('Wed, 21 Oct 2015 07:28:00 GMT')
		expect(parseRetryAfter('Wed, 21 Oct 2015 07:27:00 GMT', now)).toBe(0)
	})

	it('returns undefined for empty or unparsable values', () => {
		expect(parseRetryAfter(null, 0)).toBeUndefined()
		expect(parseRetryAfter('', 0)).toBeUndefined()
		expect(parseRetryAfter('soon', 0)).toBeUndefined()
	})
})
