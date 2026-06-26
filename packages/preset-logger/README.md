# ofetch-preset-logger

[`ofetch-presets`](https://github.com/aa900031/ofetch-presets) preset that logs each request, its response, and timing.

## Install

```bash
pnpm add ofetch-preset-logger ofetch-presets ofetch
```

## Usage

```ts
import { ofetch } from 'ofetch'
import { logger } from 'ofetch-preset-logger'
import { resolveOptions } from 'ofetch-presets'

const options = resolveOptions([
	{ baseURL: 'https://api.example.com' },
	logger(),
])

await ofetch('/users', options)
// → GET https://api.example.com/users
// ← 200 GET https://api.example.com/users (123ms)
```

Error responses go to `console.error`:

```
✗ 500 GET https://api.example.com/users (88ms)
```

Pass your own sink to route logs elsewhere (e.g. a structured logger, or to silence in production):

```ts
logger({ logger: { log: () => {}, error: report } })
```

## Custom format

Pass `format` to build the line yourself. It receives one event object per hook:

```ts
interface LoggerEvent {
	type: 'request' | 'response' | 'request-error' | 'response-error'
	requestAt: number //  epoch ms when the request hook ran
	responseAt: number | undefined //  epoch ms when the response arrived (undefined for `request`/`request-error`)
	context: FetchContext
}
```

Return a string to log it, or `undefined` to skip that event. `*-error` events go to `logger.error`, the rest to `logger.log`.

```ts
logger({
	format: ({ type, requestAt, responseAt, context }) => {
		if (type === 'request')
			return undefined // skip the outgoing line
		return JSON.stringify({
			method: context.options.method ?? 'GET',
			url: context.request,
			status: context.response?.status,
			ms: responseAt != null ? responseAt - requestAt : undefined,
		})
	},
})
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `logger` | `{ log, error }` | `console` | Sink for log lines. Only `log` and `error` are used. |
| `format` | `(event: LoggerEvent) => string \| undefined` | arrow + status + duration | Builds the log line; `undefined` skips the event. |

## License

[MIT](https://github.com/aa900031/ofetch-presets/blob/main/LICENSE)
