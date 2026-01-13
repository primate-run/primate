---
title: Web target
---


# Web

The **Web** target serves your app over HTTP. It's the default target and
runs on all runtimes (Node, Bun, Deno). `primate build` creates the server
bundle and assets; `primate serve` runs the built app.

### Build output

```
build/
└── server.js         # Production server entry
```

## Serving

```sh
npx primate serve
# or
node build/server.js
```
