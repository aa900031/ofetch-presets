import type { FetchContext } from 'ofetch'
import { parseCookie } from 'cookie-es'
import { definePreset } from 'ofetch-presets/kit'

const DEFAULT_CONFIG = {
	cookieName: 'XSRF-TOKEN',
	headerName: 'X-XSRF-TOKEN',
	cleanCsrfHeader: 'X-CSRF-TOKEN',
}

export interface XsrfTokenProps {
	cookieName?: string
	headerName?: string
	cleanCsrfHeader?: string | boolean
	getToken?: (
		props: {
			cookieName: string
		},
		context: FetchContext,
	) => string
}

export const xsrfToken = definePreset((
	props?: XsrfTokenProps,
) => {
	const getToken = props?.getToken ?? defaultGetToken
	const cookieName = props?.cookieName ?? DEFAULT_CONFIG.cookieName
	const headerName = props?.headerName ?? DEFAULT_CONFIG.headerName
	const cleanCsrfHeader = props?.cleanCsrfHeader === false
		? false
		: typeof props?.cleanCsrfHeader === 'string'
			? props.cleanCsrfHeader
			: DEFAULT_CONFIG.cleanCsrfHeader

	return {
		name: 'xsrf-token',
		options: {
			onRequest: (context) => {
				const token = getToken({ cookieName }, context)
				if (!token)
					return

				context.options.headers.set(headerName, token)
				if (cleanCsrfHeader)
					context.options.headers.delete(cleanCsrfHeader)
			},
		},
	}
})

function defaultGetToken(
	props: {
		cookieName: string
	},
): string | undefined {
	const cookie = globalThis?.window?.document?.cookie
	if (!cookie)
		return
	return parseCookie(cookie)[props.cookieName]
}
