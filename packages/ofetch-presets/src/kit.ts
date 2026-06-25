import type { Preset, PresetFactory } from './shared'

export type { FetchOptions } from 'ofetch'
export type { Preset }

export function definePreset<
	F extends PresetFactory,
>(
	factory: F,
): F {
	return factory
}
