import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";

type Render<S = unknown> = (component: S, props: Dict) => MaybePromise<{
  body: string;
  head?: string;
  headers?: Record<string, string>;
}>;

export type { Render as default };
