import error from "#error";
import schemafail from "#error/schemafail";
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
import type OptionalTrait from "#trait/Optional";
import type Validator from "#Validator";
import length from "#validator/length";
import max from "#validator/max";
import min from "#validator/min";
import unique from "#validator/unique";
import type Newable from "@rcompat/type/Newable";
import type Primitive from "@rcompat/type/Primitive";

type Next<T> = {
  validators?: Validator<T>[];
};

function isPrimitive(x: Parsed<unknown>): x is PrimitiveType<unknown, string> {
  return x instanceof PrimitiveType;
}

const is = <T>(x: unknown, validator: (t: unknown) => boolean): x is T =>
  validator(x);

export default class ArrayType<T extends Parsed<unknown>>
  extends GenericType<T, Infer<T>[], "ArrayType">
  implements OptionalTrait {
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
      throw schemafail(
        "unique: subtype {0} must be primitive", this.#item.name,
      );
    }
    return this.derive({ validators: [unique] });
  }

  min(limit: number) {
    if (limit < 0) {
      throw schemafail("min: {0} must be positive", limit);
    }
    return this.derive({ validators: [min(limit)] });
  }

  max(limit: number) {
    if (limit < 0) {
      throw schemafail("max: {0} must be positive", limit);
    }
    return this.derive({ validators: [max(limit)] });
  }

  length(from: number, to: number) {
    return this.derive({ validators: [length(from, to)] });
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (!is<T[]>(x, _ => !!x && Array.isArray(x))) {
      throw new ParseError(error("array", x, options));
    }

    const base = options[ParsedKey] ?? "";

    let last = 0;
    x.forEach((v, i) => {
      // sparse array check
      if (i > last) {
        throw new ParseError([{
          ...error(this.#item.name, undefined, options)[0],
          path: join(base, last),
        }]);
      }
      const validator = this.#item;
      validator.parse(v, next(i, options));
      last++;
    });

    // sparse array with end slots
    if (x.length > last) {
      throw new ParseError([{
        ...error(this.#item.name, undefined, options)[0],
        path: join(base, last),
      }]);
    }

    for (const v of this.#validators) {
      try {
        v(x);
      } catch (e) {
        if (e instanceof ParseError) {
          const rebased = (e.issues ?? [])
            .map(i => ({ ...i, path: rebase(base, i.path) }));
          throw new ParseError(rebased);
        }
        throw e;
      }
    }

    return x as never;
  }

  toJSON() {
    return { type: this.name, of: this.#item.toJSON() };
  }
}
