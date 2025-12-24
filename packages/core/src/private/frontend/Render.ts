import type { Dict, MaybePromise } from "@rcompat/type";

type Render<V = unknown> = (view: V, props: Dict) => MaybePromise<{
  body: string;
  head?: string;
  headers?: Record<string, string>;
}>;

export type { Render as default };
