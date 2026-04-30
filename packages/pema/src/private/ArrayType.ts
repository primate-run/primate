import DefaultType from "#DefaultType";
import EnumType from "#EnumType";
import E from "#errors";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import type Parsed from "#Parsed";
import ParsedKey from "#ParsedKey";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import join from "#path/join";
import next from "#path/next";
import rebase from "#path/rebase";
import PrimitiveType from "#PrimitiveType";
import resolve from "#resolve";
import S from "#schema-errors";
import type DefaultTrait from "#trait/Default";
import type OptionalTrait from "#trait/Optional";
import type Validator from "#Validator";
import length from "#validator/length";
import max from "#validator/max";
import min from "#validator/min";
import unique from "#validator/unique";
import uniqueBy from "#validator/unique-by";
import type { Newable, Primitive } from "@rcompat/type";

type Next<T> = {
  validators?: Validator<T>[];
};

function isPrimitive(x: Parsed<unknown>): x is PrimitiveType<unknown, string> {
  return x instanceof PrimitiveType || x instanceof EnumType;
}

export default class ArrayType<T extends Parsed<unknown>>
  extends GenericType<T, Infer<T>[], "ArrayType">
  implements OptionalTrait, DefaultTrait<Infer<T>[]> {
  #item: T;
  #validators: Validator<Array<Infer<T>>>[];

  constructor(item: T, validators: Validator<Array<Infer<T>>>[] = []) {
    super();
    this.#item = item;
    this.#validators = validators;
  }

  get name() {
    return "array" as const;
  }

  optional() {
    return new OptionalType(this);
  }

  default(value: (() => Infer<T>[]) | Infer<T>[]) {
    return new DefaultType(this, value);
  }

  derive(_next: Next<Array<Infer<T>>>): this {
    const Constructor = this.constructor as Newable<this>;
    return new Constructor(
      this.#item,
      [...this.#validators, ..._next.validators ?? []],
    );
  }

  /**
   * Member values are unique — only for primitive subtypes.
   *
   * @throws `SchemaError` if the subtype is not a primitive.
   * @returns ArrayType<T>
   */
  unique(
    this: Infer<T> extends Primitive ? ArrayType<T> : never,
  ): ArrayType<T> {
    if (!isPrimitive(this.#item)) {
      throw S.unique_subtype_not_primitive(this.#item.name);
    }
    return this.derive({ validators: [unique] });
  }

  uniqueBy<K>(select: (value: Infer<T>) => K) {
    return this.derive({ validators: [uniqueBy(select)] });
  }

  min(limit: number) {
    if (limit < 0) throw S.min_negative(limit);
    return this.derive({ validators: [min(limit)] });
  }

  max(limit: number) {
    if (limit < 0) throw S.max_negative(limit);
    return this.derive({ validators: [max(limit)] });
  }

  length(from: number, to: number) {
    return this.derive({ validators: [length(from, to)] });
  }

  parse(u: unknown, options: ParseOptions = {}): Infer<this> {
    const x = resolve(u);

    const path = options[ParsedKey] ?? "";
    if (!Array.isArray(x)) throw E.invalid_type(x, "array", path);

    const item = this.#item;
    const len = x.length;
    const out = new Array(len) as Infer<T>[];

    for (let i = 0; i < len; i++) {
      if (!(i in x)) throw E.invalid_type(undefined, item.name, join(path, i));
      out[i] = item.parse(x[i], next(i, options));
    }

    const validators = this.#validators;
    for (let i = 0; i < validators.length; i++) {
      try {
        validators[i](out);
      } catch (e) {
        if (ParseError.is(e)) {
          throw new ParseError(e.issues.map(issue =>
            ({ ...issue, path: rebase(path, issue.path) })));
        }
        throw e;
      }
    }

    return out as never;
  }

  toJSON() {
    return { type: this.name, of: this.#item.toJSON() };
  }
}
