# ofetch-preset-retry-after

[`ofetch-presets`](https://github.com/aa900031/ofetch-presets) preset that honours the server's `Retry-After` header when retrying.

ofetch's built-in `retryDelay` is a fixed number and ignores `Retry-After`. This preset supplies a `retryDelay` that reads the header (delay-seconds **or** an HTTP-date) and waits exactly that long.

## Install

```bash
pnpm add ofetch-preset-retry-after ofetch-presets ofetch
```

## Usage

Compose it with a `retry` count — the preset only controls the *delay*:

```ts
import { ofetch } from 'ofetch'
import { retryAfter } from 'ofetch-preset-retry-after'
import { resolveOptions } from 'ofetch-presets'

const options = resolveOptions([
	{ baseURL: 'https://api.example.com', retry: 3 },
	retryAfter({ maxDelay: 30_000 }),
])

await ofetch('/users', options)
// On 429/503 with `Retry-After: 5`, waits 5s before each retry.
```

ofetch's default `retryStatusCodes` already include `429` and `503`, so no extra config is needed for the common rate-limit case.

The header parser is exported for reuse:

```ts
import { parseRetryAfter } from 'ofetch-preset-retry-after'

parseRetryAfter('120', Date.now()) // → 120000 (ms)
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `headerName` | `string` | `Retry-After` | Header to read. |
| `fallbackDelay` | `number` | `0` | Delay (ms) when the header is absent or unparsable. |
| `maxDelay` | `number` | — | Upper bound (ms) on the delay. No cap by default. |

## License

[MIT](https://github.com/aa900031/ofetch-presets/blob/main/LICENSE)
