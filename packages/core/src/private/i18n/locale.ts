import type Catalog from "#i18n/Catalog";

type Prev = [never, 0, 1, 2, 3, 4, 5, 6];

type DotKeyMessage<K extends string> =
  `i18n: dots not allowed in catalog key '${K}', use nested objects instead`;

type EnforceNoDots<T, D extends number = 6> =
  [D] extends [never] ? T :
  T extends string ? T :
  T extends readonly (infer E)[]
  ? readonly EnforceNoDots<E, Prev[D]>[]
  : T extends object
  ? {
    [K in keyof T]:
    K extends string
    ? K extends `${string}.${string}`
    ? DotKeyMessage<K>
    : EnforceNoDots<T[K], Prev[D]>
    : EnforceNoDots<T[K], Prev[D]>;
  }
  : T;

export default function locale<const M extends Catalog>(
  messages: EnforceNoDots<M>,
): M {
  return messages as unknown as M;
}
