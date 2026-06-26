# ofetch-preset-xsrf-token

[`ofetch-presets`](https://github.com/aa900031/ofetch-presets) preset that reads an XSRF token from the browser cookie and sends it as a request header — the double-submit-cookie pattern used by Laravel, Django, Angular, axios, and others.

## Install

```bash
pnpm add ofetch-preset-xsrf-token ofetch-presets ofetch
```

## Usage

```ts
import { ofetch } from 'ofetch'
import { xsrfToken } from 'ofetch-preset-xsrf-token'
import { resolveOptions } from 'ofetch-presets'

const options = resolveOptions([
	{ baseURL: 'https://api.example.com' },
	xsrfToken(),
])

await ofetch('/orders', { ...options, method: 'POST' })
// Reads the `XSRF-TOKEN` cookie → sends `X-XSRF-TOKEN: <token>`
```

By default it reads `document.cookie`. When the cookie is absent (SSR, empty jar), the header is simply skipped — the request is not blocked. To supply the cookie yourself (e.g. on the server), pass `getToken`:

```ts
xsrfToken({ getToken: ({ cookieName }) => readCookie(req, cookieName) })
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `cookieName` | `string` | `XSRF-TOKEN` | Cookie to read the token from. |
| `headerName` | `string` | `X-XSRF-TOKEN` | Header to send the token in. |
| `cleanCsrfHeader` | `string \| boolean` | `X-CSRF-TOKEN` | Header to delete before sending (avoids sending a stale CSRF header alongside). `false` disables this. |
| `getToken` | `({ cookieName }, context) => string` | reads `document.cookie` | Override how the token is resolved. |

## License

[MIT](https://github.com/aa900031/ofetch-presets/blob/main/LICENSE)
