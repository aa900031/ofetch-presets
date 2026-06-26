import type { FetchOptions } from 'ofetch'

export interface Preset<
	Options extends FetchOptions = FetchOptions,
> {
	name: string
	options?: Options
	presets?: ReadonlyArray<Preset | Options | null | undefined | false>
	[key: string]: unknown
}

export type PresetFactory<
	Args extends any[] = any[],
	Options extends FetchOptions = FetchOptions,
> = (...args: Args) => Preset<Options>

export type ResolvedOptions<
	Options extends FetchOptions = FetchOptions,
>
	= & Omit<Options, 'params' | 'headers'>
		& {
			headers: Headers
			[key: string]: unknown
		}
