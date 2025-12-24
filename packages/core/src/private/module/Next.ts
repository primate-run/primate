import type { MaybePromise } from "@rcompat/type";

type Next<I, O = I> = (i: I) => MaybePromise<O>;

export type { Next as default };
