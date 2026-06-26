import type { FetchOptions } from 'ofetch'
import type { Preset, ResolvedOptions } from './shared'

export type { FetchOptions } from 'ofetch'
export type { Preset, ResolvedOptions }

const HOOK_KEYS = new Set<string>([
	'onRequest',
	'onRequestError',
	'onResponse',
	'onResponseError',
])

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (value === null || typeof value !== 'object' || Array.isArray(value))
		return false
	const proto = Object.getPrototypeOf(value) as unknown
	return proto === Object.prototype || proto === null
}

function isStructuralPreset(value: Record<string, unknown>): boolean {
	return 'name' in value && ('options' in value || 'presets' in value)
}

function assertValidPreset(value: Record<string, unknown>, trace: string): void {
	if (typeof value.name !== 'string')
		throw new TypeError(`[ofetch-presets] Invalid preset at ${trace}: name must be a string`)
	if (value.options !== undefined && !isPlainObject(value.options))
		throw new TypeError(`[ofetch-presets] Invalid preset at ${trace}: options must be a plain object`)
	if (value.presets !== undefined && !Array.isArray(value.presets))
		throw new TypeError(`[ofetch-presets] Invalid preset at ${trace}: presets must be an array`)
}

function cloneValue(value: unknown): unknown {
	if (Array.isArray(value))
		return [...value]
	if (isPlainObject(value))
		return { ...value }
	return value
}

function mergeHeaders(base: Headers, init: unknown, trace: string): Headers {
	let incoming: Headers
	try {
		incoming = new Headers(init as any)
	}
	catch (cause) {
		throw new TypeError(`[ofetch-presets] Invalid headers at ${trace}: ${(cause as Error).message}`)
	}
	const merged = new Headers(base)
	incoming.forEach((v, k) => merged.set(k, v))
	return merged
}

function applySource(out: Record<string, unknown>, source: Record<string, unknown>, trace: string): void {
	if (source.params !== undefined && source.query !== undefined)
		throw new TypeError(`[ofetch-presets] params and query cannot both be specified in the same source (${trace})`)

	for (const key of Object.keys(source)) {
		const value = source[key]
		if (value === undefined)
			continue

		if (key === 'params') {
			out.query = cloneValue(value)
			continue
		}

		if (key === 'headers') {
			out.headers = mergeHeaders(out.headers as Headers, value, trace)
			continue
		}

		if (HOOK_KEYS.has(key)) {
			const prior = (out[key] as unknown[]) ?? []
			const next = Array.isArray(value) ? value : [value]
			out[key] = [...prior, ...next]
			continue
		}

		out[key] = cloneValue(value)
	}
}

function processSource(
	source: unknown,
	out: Record<string, unknown>,
	visiting: Set<Record<string, unknown>>,
	trace: string,
): void {
	if (!isPlainObject(source))
		return

	if (isStructuralPreset(source)) {
		resolvePreset(source, out, visiting, trace)
		return
	}

	applySource(out, source, trace)
}

function resolvePreset(
	preset: Record<string, unknown>,
	out: Record<string, unknown>,
	visiting: Set<Record<string, unknown>>,
	trace: string,
): void {
	assertValidPreset(preset, trace)

	if (visiting.has(preset))
		throw new TypeError(`[ofetch-presets] Circular preset dependency at ${trace}`)

	visiting.add(preset)

	if (preset.presets !== undefined) {
		const presets = preset.presets as ReadonlyArray<unknown>
		for (let i = 0; i < presets.length; i++)
			processSource(presets[i], out, visiting, `${trace}.presets[${i}]`)
	}

	if (preset.options !== undefined) {
		applySource(out, preset.options as Record<string, unknown>, `${trace}.options`)
	}

	visiting.delete(preset)
}

export function resolveOptions<
	Options extends FetchOptions = FetchOptions,
>(
	sources: (Preset | Options | null | undefined | false)[],
): ResolvedOptions<Options> {
	const out: Record<string, unknown> = { headers: new Headers() }
	const visiting = new Set<Record<string, unknown>>()

	for (let i = 0; i < sources.length; i++)
		processSource(sources[i], out, visiting, `sources[${i}]`)

	return out as ResolvedOptions<Options>
}
