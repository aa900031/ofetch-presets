import type { FetchContext } from 'ofetch'
import type { LoggerEventType, LoggerFormatFn } from './format'
import { definePreset } from 'ofetch-presets/kit'
import { defaultLoggerFormat } from './format'

export interface LoggerProps {
	/** Sink for log lines. Defaults to the global `console`. */
	logger?: Pick<Console, 'log' | 'error'>
	/**
	 * Build the log line for an event. Return `undefined` to skip logging that event.
	 * `*-error` events are sent to `logger.error`, the rest to `logger.log`.
	 */
	format?: LoggerFormatFn
}

export const logger = definePreset((
	props?: LoggerProps,
) => {
	const starts = new WeakMap<FetchContext, number>()
	const sink = props?.logger ?? console
	const format = props?.format ?? defaultLoggerFormat

	return {
		name: 'logger',
		options: {
			onRequest: (context: FetchContext) => {
				starts.set(context, Date.now())
				emit('request', context, undefined)
			},
			onResponse: (context: FetchContext) => {
				emit('response', context, Date.now())
			},
			onRequestError: (context: FetchContext) => {
				emit('request-error', context, undefined)
			},
			onResponseError: (context: FetchContext) => {
				emit('response-error', context, Date.now())
			},
		},
	}

	function emit(
		type: LoggerEventType,
		context: FetchContext,
		responseAt: number | undefined,
	): void {
		const requestAt = starts.get(context) ?? Date.now()
		const line = format({ type, requestAt, responseAt, context })
		if (line == null)
			return

		switch (type) {
			case 'request-error':
			case 'response-error':
				sink.error(line)
				break
			default:
				sink.log(line)
				break
		}
	}
})
