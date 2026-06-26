import type { FetchContext } from 'ofetch'
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
			// Honour the server's Retry-After. Compose with `{ retry: N }` to enable retries;
			// ofetch's default retryStatusCodes already include 429/503.
			retryDelay: (context: FetchContext) => {
				const header = context.response?.headers.get(headerName)
				const delay = parseRetryAfter(header, Date.now()) ?? fallbackDelay
				return maxDelay != null ? Math.min(delay, maxDelay) : delay
			},
		},
	}
})
