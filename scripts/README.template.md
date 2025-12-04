# DESC

## Install

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# Deno
deno install

# Bun
bun install
```

## Run in development mode

```bash
# Node
npx primate

# Deno
deno run -A npm:primate

# Bun
bunx --bun primate
```

## Build for production

```bash
# Node
npx primate build

# Deno
deno run -A npm:primate build

# Bun
bunx --bun primate build
```

## Serve for production

```bash
# npm
npx primate serve

# Deno
deno run -A npm:primate serve

# Bun
bunx --bun primate serve
```

## Serve for production without a package manager

If you just want to run the built server directly:

```bash
# Node
node build/server.js

# Deno
deno run -A build/server.js

# Bun
bun build/server.js
```

## Documentation

Visit [primate.run/docs](https://primate.run/docs) for full documentation.

## Issues

File issues against https://github.com/primate-run/primate.

## License

MIT
