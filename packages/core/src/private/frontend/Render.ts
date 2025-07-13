import type Props from "#frontend/Props";
import type MaybePromise from "@rcompat/type/MaybePromise";

type Render<S = unknown> = (component: S, props: Props) => MaybePromise<{
  body: string;
  head?: string;
  headers?: Record<string, string>;
}>;

export type { Render as default };
