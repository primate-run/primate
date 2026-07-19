import CoerceKey from "#CoerceKey";
import E from "#errors";
import type Infer from "#Infer";
import Loose from "#Loose";
import ParsedKey from "#ParsedKey";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import resolve from "#resolve";
import Type from "#Type";
import type Validator from "#Validator";
import is from "@rcompat/is";
import type { JSONPointer, Newable } from "@rcompat/type";

type Next<T> = {
  options?: ParseOptions;
  validators?: Validator<T>[];
};

export default abstract class PrimitiveType<StaticType, Name extends string>
  extends Type<StaticType, Name> {
  #validators: Validator<StaticType>[];
  #options: ParseOptions;

  constructor(
    validators: Validator<StaticType>[] = [],
    options: ParseOptions = {},
  ) {
    super();
    this.#validators = validators;
    this.#options = options;
  }

  get options() {
    return this.#options;
  }

  get validators() {
    return this.#validators;
  }

  with(next: Next<StaticType>): this {
    const Constructor = this.constructor as Newable<this>;
    return new Constructor(
      [...this.#validators, ...next.validators ?? []],
      { ...this.#options, ...next.options ?? {} },
    );
  }

  check(predicate: (value: StaticType) => boolean, message: string) {
    return this.with({
      validators: [value => {
        if (!predicate(value)) throw E.invalid_format(value, message);
      }],
    });
  }

  parse(u: unknown, options: ParseOptions<StaticType> = {}): Infer<this> {
    const x = resolve(u);

    // hotpath: avoid object spread when possible
    const has_instance_options = is.defined(this.#options[ParsedKey]);
    const $options = has_instance_options
      ? { ...this.#options, ...options }
      : options;

    // hotpath: avoid array spread when no option validators
    const option_validators = $options.validators;
    const validators = option_validators && option_validators.length > 0
      ? option_validators.concat(this.#validators)
      : this.#validators;

    const loose = this[Loose] ?? $options[Loose] ?? false;
    const $x = loose ? this[CoerceKey](x) : x;

    if (typeof $x !== this.name) throw E.invalid_type($x, this.name, $options);
    const base = $options[ParsedKey] ?? "";

    for (let i = 0; i < validators.length; i++) {
      try {
        validators[i]($x as StaticType);
      } catch (e) {
        if (ParseError.is(e)) {
          // rebase each issue path under `base`
          const rebased = e.issues.map(issue => ({
            ...issue,
            path: issue.path === ""
              ? base
              : (base === "" ? issue.path : (base + issue.path) as JSONPointer),
          }));
          throw new ParseError(rebased);
        }
        // not a ParseError - wrap with proper path
        const message = e && typeof (e as any).message === "string"
          ? (e as any).message
          : String(e);
        throw E.invalid_type(x, message, base);
      }
    }
    return $x as never;
  }
}
