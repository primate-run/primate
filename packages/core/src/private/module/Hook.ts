import type MaybePromise from "@rcompat/type/MaybePromise";
import type Next from "#module/Next";

type Hook<I, O = I> = (t: I, next: Next<I, O>) => MaybePromise<O>;

export type { Hook as default };
