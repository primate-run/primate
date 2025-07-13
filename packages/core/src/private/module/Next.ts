import type MaybePromise from "@rcompat/type/MaybePromise";

type Next<I, O = I> = (i: I) => MaybePromise<O>;

export type { Next as default };
