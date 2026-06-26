import { definePreset } from 'ofetch-presets/kit'
import { parseRetryAfter } from './parse'

const DEFAULT_HEADER_NAME = 'Retry-After'

export interface RetryAfterProps {
	/** Header to read. Default `Retry-After`. */
	headerName?: string
	/** Delay (ms) used when the header is absent or unparsable. Default `0`. */
	fallbackDelay?: number
	/** Upper bound (ms) on the delay. Default: no cap. */
	maxDelay?: number
}

export const retryAfter = definePreset((
	props?: RetryAfterProps,
) => {
	const headerName = props?.headerName ?? DEFAULT_HEADER_NAME
	const fallbackDelay = props?.fallbackDelay ?? 0
	const maxDelay = props?.maxDelay

	return {
		name: 'retry-after',
		options: {
			retryDelay: (context) => {
				const header = context.response?.headers.get(headerName)
				const delay = parseRetryAfter(header, Date.now()) ?? fallbackDelay
				return maxDelay != null ? Math.min(delay, maxDelay) : delay
			},
		},
	}
})
