import type BuildApp from "#build/App";
import type { Plugin } from "esbuild";

type Publish = (app: BuildApp, extension: string) => Plugin;

export { Publish as default };
