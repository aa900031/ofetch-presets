# ofetch-presets

Compose reusable [`ofetch`](https://github.com/unjs/ofetch) options from named, dependency-aware presets.

Define option fragments once — a base URL, auth headers, retry policy, logging hooks — then combine them per request.

## Install

```bash
pnpm add ofetch-presets ofetch
```

`ofetch` is a peer dependency (v1).

## Quick start

```ts
import { ofetch } from 'ofetch'
import { resolveOptions } from 'ofetch-presets'

const options = resolveOptions([
	{ baseURL: 'https://api.example.com' },
	{ headers: { Authorization: `Bearer ${token}` } },
	{ retry: 3, retryStatusCodes: [502, 503] },
])

const data = await ofetch('/users', options)
```

Sources are applied in order, so later sources override earlier ones. Falsy entries (`null`, `undefined`, `false`) are skipped — useful for conditionals:

```ts
resolveOptions([
	base,
	isDev && { baseURL: 'http://localhost:3000' },
])
```

## Presets

A preset is a named object with `options` and/or `presets` (its dependencies). Dependencies resolve before the preset's own options.

```ts
import { resolveOptions } from 'ofetch-presets'
import { definePreset } from 'ofetch-presets/kit'

const base = definePreset(() => ({
	name: 'base',
	options: { baseURL: 'https://api.example.com', timeout: 5000 },
}))

const authed = definePreset(() => ({
	name: 'authed',
	presets: [base()],
	options: { headers: { Authorization: `Bearer ${token}` } },
}))

const options = resolveOptions([authed()])
// → baseURL + timeout from `base`, Authorization header from `authed`
```

### Authoring presets

Use `definePreset` from the `/kit` entry to write preset factories with full type inference. It's an identity helper — no runtime wrapping, no branding.

```ts
import { definePreset } from 'ofetch-presets/kit'

export const withAuth = definePreset((token: string) => ({
	name: 'auth',
	options: { headers: { Authorization: `Bearer ${token}` } },
}))

// consumer
resolveOptions([withAuth(token)])
```

## Composition rules

How `resolveOptions` combines fields across sources:

| Field | Rule |
| --- | --- |
| `headers` | Merged into one `Headers` instance; later keys overwrite earlier ones |
| `params` | Normalized to `query` (alias); can't appear alongside `query` in the same source |
| `onRequest`, `onRequestError`, `onResponse`, `onResponseError` | Concatenated in source order; single functions normalized to arrays |
| Plain objects (e.g. `body`) | Shallow-cloned, whole-value replacement |
| Arrays (e.g. `retryStatusCodes`) | Replaced entirely by the latest source — not concatenated |
| Scalars | Last write wins |

Resolution is **synchronous** and **immutable**: source objects are never mutated, and headers are detached from their inputs.

### Errors

Validation is fail-fast. `resolveOptions` throws a `TypeError` for:

- a preset whose `name` isn't a string, `options` isn't a plain object, or `presets` isn't an array
- `params` and `query` both set in one source
- a circular preset dependency

Error messages carry a positional trace (e.g. `sources[1].presets[0]`) to pinpoint the offending source.

## API

### `resolveOptions(sources)`

`ofetch-presets`. Takes an ordered array of presets, plain `FetchOptions`, or falsy values; returns a single resolved `FetchOptions` with normalized `headers` (a `Headers` instance) and `query`.

### `definePreset(factory)`

`ofetch-presets/kit`. Returns the factory unchanged with its types preserved. Factories may take any parameters.

## License

Made with ❤️

Published under the [MIT License](https://github.com/aa900031/ofetch-presets/blob/main/LICENSE).
