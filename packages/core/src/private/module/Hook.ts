import type Next from "#module/Next";
import type { MaybePromise } from "@rcompat/type";

type Hook<I, O = I> = (t: I, next: Next<I, O>) => MaybePromise<O>;

export type { Hook as default };
