import DefaultType from "#DefaultType";
import OptionalType from "#OptionalType";
import type ParseOptions from "#ParseOptions";
import S from "#schema-errors";
import Storable from "#Storable";
import type UintType from "#UintType";
import type { Dict } from "@rcompat/type";

const KEY = /^[A-Z][A-Z0-9_]*$/;

export default class EnumType<
  V extends Dict<number>,
  L extends boolean | undefined = undefined,
> extends Storable<"u8", V[keyof V]> {
  #values: V;
  #reverse: Map<number, keyof V>;
  #inner: UintType<"u8", L>;

  constructor(values: V, inner: UintType<"u8", L>) {
    super();

    for (const key of Object.keys(values)) {
      if (!KEY.test(key)) throw S.enum_invalid_key(key);
    }

    this.#values = values;
    this.#reverse = new Map(
      Object.entries(values).map(([k, v]) => [v as number, k]),
    );
    this.#inner = inner.values(values);

    Object.assign(this, values);
    Object.freeze(this);
  }

  get name() {
    return Object.keys(this.#values).map(k => `"${k}"`).join(" | ");
  }

  get datatype() {
    return "u8" as const;
  }

  get values() {
    return this.#values;
  }

  nameOf(value: V[keyof V]): keyof V {
    return this.#reverse.get(value as number)!;
  }

  optional() {
    return new OptionalType(this);
  }

  default<D extends V[keyof V]>(value: (() => D) | D) {
    return new DefaultType<EnumType<V, L>, D>(this, value);
  }

  parse(u: unknown, options: ParseOptions = {}): V[keyof V] {
    return this.#inner.parse(u, options) as never;
  }

  toJSON() {
    return {
      type: "enum" as const,
      datatype: "u8" as const,
      values: { ...this.#values },
    };
  }
}

export type Enum<
  V extends Dict<number>,
  L extends boolean | undefined = undefined,
> = EnumType<V, L> & V;
