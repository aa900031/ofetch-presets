import type { FetchContext } from 'ofetch'

export type LoggerEventType = 'request' | 'response' | 'request-error' | 'response-error'

export interface LoggerEvent {
	type: LoggerEventType
	/** Epoch ms when the request hook ran. */
	requestAt: number
	/** Epoch ms when the response/error hook ran. `undefined` when there is no response yet. */
	responseAt: number | undefined
	context: FetchContext
}

export type LoggerFormatFn = (
	event: LoggerEvent,
) => string | undefined

export function defaultLoggerFormat(
	event: LoggerEvent,
): string | undefined {
	const { type, requestAt, responseAt, context } = event
	const method = (context.options.method ?? 'GET').toUpperCase()
	const url = typeof context.request === 'string' ? context.request : context.request.url
	const status = context.response?.status
	const elapsed = responseAt != null ? ` (${Math.round(responseAt - requestAt)}ms)` : ''

	switch (type) {
		case 'request':
			return `→ ${method} ${url}`
		case 'response':
			// ofetch fires onResponse for error statuses too; defer those to the response-error event.
			return status != null && status >= 400
				? undefined
				: `← ${status ?? '-'} ${method} ${url}${elapsed}`
		case 'request-error':
			return `✗ ${method} ${url} (request failed: ${context.error?.message ?? 'unknown'})`
		case 'response-error':
			return `✗ ${status ?? '-'} ${method} ${url}${elapsed}`
	}
}
