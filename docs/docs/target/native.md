# Native

The Native target compiles your Primate application into standalone desktop
executables for Windows, macOS, and Linux. It embeds your app and uses a
system **WebView** to render the UI.

Under the hood, Primate runs an HTTP server **inside the executable** and
points the WebView at it, so you ship a single desktop app without needing a
separate web server.

## Setup

Install the native module:

```bash
npm install @primate/native
```

Configure your application:

```ts
// config/app.ts
import config from "primate/config";
import native from "@primate/native";

export default config({
  modules: [native()],
});
```

## How it works

Primate starts a lightweight HTTP server in the app process and boots a
WebView window to display your routes. Navigation, cookies, and fetch requests
work as they do in the browser.

* **Server**: serves your built app; you can still use routes, middleware,
  and modules.
* **WebView**: renders your UI using the system WebView for each platform.

!!!
If you proxy to external services, keep in mind you're now a **desktop**
process. Network access, TLS, and CORS behave like any other HTTP client.
!!!

## Platform Support

Currently supported platforms:

| Platform     | Runtime | Status |
| ------------ | ------- | ------ |
| linux-x64    | Bun     | ✓      |
| windows-x64  | Bun     | ✓      |
| darwin-x64   | Bun     | ⚠️     |
| darwin-arm64 | Bun     | ⚠️     |

⚠️ = In development

## Building

### Development

Build Primate with the native target:

```bash
bunx --bun primate build desktop
```

This will create an executable `app` (or `app.exe` on Windows) inside `build`.

### Cross-compilation

You can target specific platforms from your development machine:

```json
{
  "scripts": {
    "build:linux-x64": "bunx --bun primate build linux-x64",
    "build:darwin-x64": "bunx --bun primate build darwin-x64",
    "build:darwin-arm64": "bunx --bun primate build darwin-arm64",
    "build:windows-x64": "bunx --bun primate build windows-x64"
  }
}
```

Run, for example:

```bash
bunx --bun primate build windows-x64
```

### Build Output

```
build/
├── app              # Linux/MacOS executable
└── app.exe          # Windows executable
```

## Configuration

| Option  | Type      | Default | Description                     |
| ------- | --------- | ------- | ------------------------------- |
| `start` | `string`  | `"/"`   | Initial route when app launches |
| `debug` | `boolean` | `false` | Enable debug logging            |

### Example

```ts
import native from "@primate/native";

export default config({
  modules: [
    native({
      // start URL when app launches
      start: "/",

      // enable debug mode
      debug: false,
    }),
  ],
});
```

## Distribution

Shipping native apps usually involves platform packaging and signing:

* **Windows**: package/sign your `app.exe` as needed for distribution.
* **macOS**: wrap the executable into an `.app` bundle, then notarize/sign.
* **Linux**: distribute the binary directly or via a package format of choice.

These steps depend on your release tooling; integrate them after
`primate build` completes.
