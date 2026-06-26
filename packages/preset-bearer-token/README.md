# ofetch-preset-bearer-token

[`ofetch-presets`](https://github.com/aa900031/ofetch-presets) preset that attaches a bearer token to every request via an `onRequest` hook.

## Install

```bash
pnpm add ofetch-preset-bearer-token ofetch-presets ofetch
```

## Usage

```ts
import { ofetch } from 'ofetch'
import { bearerToken } from 'ofetch-preset-bearer-token'
import { resolveOptions } from 'ofetch-presets'

const options = resolveOptions([
	{ baseURL: 'https://api.example.com' },
	bearerToken({ getToken: () => localStorage.getItem('access_token') }),
])

await ofetch('/me', options)
// → Authorization: Bearer <token>
```

`getToken` may be async (e.g. read from a refreshing store):

```ts
bearerToken({ getToken: async () => (await auth.session()).accessToken })
```

A falsy token skips the header, so anonymous requests still go through.

## Refresh on 401

Pass `refresh` to recover from an expired token: when a request comes back unauthorized, the preset refreshes the token **once** and retries the request with the new one.

```ts
bearerToken({
	getToken: () => store.accessToken,
	refresh: async () => {
		store.accessToken = await auth.refresh()
	},
})
```

How it works: on a `401`, `refresh` runs, then ofetch retries — the retry re-runs `getToken`, so the refreshed token is applied automatically. The refresh fires at most once per request (a second `401` fails normally instead of looping).

Because ofetch only retries statuses in `retryStatusCodes` (and defaults `POST`/`PUT`/`PATCH`/`DELETE` to no retries), enabling `refresh` makes the preset set `retry: 1` and add the refresh codes to `retryStatusCodes` (ofetch's defaults are kept). These are plain `FetchOptions` fields composed with last-write-wins — if you set `retry`/`retryStatusCodes` in another source, apply it before this preset or include the auth code yourself.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `getToken` | `(context) => string \| null \| undefined \| Promise<…>` | — | **Required.** Resolves the token per request. |
| `headerName` | `string` | `Authorization` | Header to set. |
| `scheme` | `string \| false` | `Bearer` | Prefix before the token. `false` sends the raw token with no prefix. |
| `refresh` | `(context) => unknown \| Promise<unknown>` | — | Refresh the token on an unauthorized response, then retry once. Enabling it sets `retry`/`retryStatusCodes` (see above). |
| `refreshStatusCodes` | `number[]` | `[401]` | Statuses that trigger refresh + retry. |

## License

[MIT](https://github.com/aa900031/ofetch-presets/blob/main/LICENSE)
