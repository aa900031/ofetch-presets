import type { FetchContext } from 'ofetch'
import { definePreset } from 'ofetch-presets/kit'

const DEFAULT_HEADER_NAME = 'Authorization'
const DEFAULT_SCHEME = 'Bearer'
const DEFAULT_REFRESH_STATUS_CODES = [401]

const REFRESHED = Symbol('ofetch-preset-bearer-token:refreshed')

export interface BearerTokenProps {
	/** Resolves the token. Falsy result skips the header (so anonymous requests still go through). */
	getToken: (context: FetchContext) => string | undefined | null | Promise<string | undefined | null>
	/** Header to set. Default `Authorization`. */
	headerName?: string
	/** Scheme prefix, e.g. `Bearer`. Set `false` to send the raw token with no prefix. */
	scheme?: string | false
	/**
	 * Refresh the token when a request comes back unauthorized, then retry it once.
	 * Runs at most once per request. Enabling this makes the preset own `retry` and
	 * `retryStatusCodes` (whole-value, last-write-wins) so the retry actually fires.
	 */
	refresh?: (context: FetchContext) => unknown | Promise<unknown>
	/** Statuses that trigger refresh + retry. Default `[401]`. */
	refreshStatusCodes?: number[]
}

export const bearerToken = definePreset((
	props: BearerTokenProps,
) => {
	const headerName = props.headerName ?? DEFAULT_HEADER_NAME
	const scheme = props.scheme === false ? '' : (props.scheme ?? DEFAULT_SCHEME)
	const refresh = props.refresh
	const refreshStatusCodes = props.refreshStatusCodes ?? DEFAULT_REFRESH_STATUS_CODES

	return {
		name: 'bearer-token',
		options: {
			onRequest: async (context: FetchContext) => {
				const token = await props.getToken(context)
				if (token)
					context.options.headers.set(headerName, scheme ? `${scheme} ${token}` : token)
				else
					// Clear any stale header so a refresh that drops the token retries anonymously.
					context.options.headers.delete(headerName)
			},
			...(refresh
				? {
						// Retry only the auth statuses — not ofetch's general 5xx set, which would re-send
						// non-idempotent writes the server may already have applied.
						retry: 1,
						retryStatusCodes: refreshStatusCodes,
						onResponseError: async (context: FetchContext) => {
							const status = context.response?.status
							if (status == null || !refreshStatusCodes.includes(status))
								return

							const options = context.options as unknown as Record<PropertyKey, unknown>
							if (options[REFRESHED])
								return
							options[REFRESHED] = true

							await refresh(context)
							// The retry re-runs onRequest, which re-reads getToken and applies the new token.
						},
					}
				: {}),
		},
	}
})
