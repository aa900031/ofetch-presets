/**
 * Parse an HTTP `Retry-After` value into milliseconds.
 * Accepts both delay-seconds (`120`) and an HTTP-date. Returns `undefined` when unparsable.
 */
export function parseRetryAfter(value: string | null | undefined, nowMs: number): number | undefined {
	if (!value)
		return undefined

	const seconds = Number(value)
	if (Number.isInteger(seconds) && seconds >= 0)
		return seconds * 1000

	const date = Date.parse(value)
	if (!Number.isNaN(date))
		return Math.max(0, date - nowMs)

	return undefined
}
