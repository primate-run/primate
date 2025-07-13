import type BuildApp from "#BuildApp";
import type { Plugin } from "esbuild";

type Publish = (app: BuildApp, extension: string) => Plugin;

export { Publish as default };
