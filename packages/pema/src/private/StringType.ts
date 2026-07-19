import CoerceKey from "#CoerceKey";
import E from "#errors";
import type Infer from "#Infer";
import Loose from "#Loose";
import ParsedKey from "#ParsedKey";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import PrimitiveType from "#PrimitiveType";
import resolve from "#resolve";
import S from "#schema-errors";
import Storable from "#Storable";
import email from "#validator/email";
import ends_with from "#validator/ends-with";
import isotime from "#validator/isotime";
import length from "#validator/length";
import max from "#validator/max";
import type MessageOptions from "#validator/MessageOptions";
import min from "#validator/min";
import regex from "#validator/regex";
import starts_with from "#validator/starts-with";
import is from "@rcompat/is";
import type { JSONPointer } from "@rcompat/type";

type Transform = (value: string) => string;

type Next = {
  options?: ParseOptions;
  transforms?: Transform[];
  validators?: ((value: string) => void)[];
};

export default class StringType
  extends PrimitiveType<string, "StringType">
  implements Storable<"string"> {
  #transforms: Transform[];

  constructor(
    validators: ((value: string) => void)[] = [],
    options: ParseOptions = {},
    transforms: Transform[] = [],
  ) {
    super(validators, options);
    this.#transforms = transforms;
  }

  get name() {
    return "string" as const;
  }

  get datatype() {
    return "string" as const;
  }

  with(next: Next): this {
    return new StringType(
      [...this.validators, ...next.validators ?? []],
      { ...this.options, ...next.options ?? {} },
      [...this.#transforms, ...next.transforms ?? []],
    ) as this;
  }

  parse(u: unknown, options: ParseOptions<string> = {}): Infer<this> {
    const x = resolve(u);
    const has_instance_options = is.defined(this.options[ParsedKey]);
    const $options = has_instance_options
      ? { ...this.options, ...options }
      : options;
    const loose = this[Loose] ?? $options[Loose] ?? false;
    const $x = loose ? this[CoerceKey](x) : x;

    if (typeof $x !== this.name) throw E.invalid_type($x, this.name, $options);

    let value = $x as string;
    for (const transform of this.#transforms) {
      value = transform(value);
    }

    const option_validators = $options.validators;
    const validators = is.array(option_validators)
      ? option_validators.concat(this.validators)
      : this.validators;
    const base = $options[ParsedKey] ?? "";

    for (let i = 0; i < validators.length; i++) {
      try {
        validators[i](value);
      } catch (e) {
        if (ParseError.is(e)) {
          const rebased = e.issues.map(issue => ({
            ...issue,
            path: issue.path === ""
              ? base
              : (base === "" ? issue.path : (base + issue.path) as JSONPointer),
          }));
          throw new ParseError(rebased);
        }

        const message = is.error(e) && is.string(e.message)
          ? e.message
          : String(e);
        throw E.invalid_type(x, message, base);
      }
    }

    return value as Infer<this>;
  }

  trim() {
    return this.with({ transforms: [value => value.trim()] });
  }

  lowercase() {
    return this.with({ transforms: [value => value.toLowerCase()] });
  }

  uppercase() {
    return this.with({ transforms: [value => value.toUpperCase()] });
  }

  isotime(options?: MessageOptions<string>) {
    return this.with({ validators: [isotime(options)] });
  }

  regex(pattern: RegExp, options?: MessageOptions<string>) {
    return this.with({ validators: [regex(pattern, options)] });
  }

  email(options?: MessageOptions<string>) {
    return this.with({ validators: [email(options)] });
  }

  startsWith(prefix: string, options?: MessageOptions<string>) {
    return this.with({ validators: [starts_with(prefix, options)] });
  }

  endsWith(suffix: string, options?: MessageOptions<string>) {
    return this.with({ validators: [ends_with(suffix, options)] });
  }

  min(limit: number, options?: MessageOptions<string>) {
    if (limit < 0) throw S.min_negative(limit);
    return this.with({ validators: [min(limit, options)] });
  }

  max(limit: number, options?: MessageOptions<string>) {
    if (limit < 0) throw S.max_negative(limit);
    return this.with({ validators: [max(limit, options)] });
  }

  length(from: number, to: number, options?: MessageOptions<string>) {
    return this.with({ validators: [length(from, to, options)] });
  }

  toJSON() {
    return Storable.serialize(this);
  }
}
