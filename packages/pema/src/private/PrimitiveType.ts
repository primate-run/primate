import CoercedType from "#CoercedType";
import CoerceKey from "#CoerceKey";
import error from "#error";
import type Infer from "#Infer";
import ParsedKey from "#ParsedKey";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import Type from "#Type";
import type Validator from "#Validator";
import type JSONPointer from "@rcompat/type/JSONPointer";

export default class PrimitiveType<StaticType, Name extends string>
  extends Type<StaticType, Name> {
  #name: string;
  #validators: Validator<StaticType>[];

  constructor(name: string, validators: Validator<StaticType>[] = []) {
    super();
    this.#name = name;
    this.#validators = validators;
  }

  get name() {
    return this.#name;
  }

  get validators() {
    return this.#validators;
  }

  get coerce() {
    return new CoercedType(this);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    const $x = options.coerce === true ? this[CoerceKey](x) : x;

    if (typeof $x !== this.name) {
      throw new ParseError(error(this.name, $x, options));
    }
    const base = options[ParsedKey] ?? "";

    for (const v of this.#validators) {
      try {
        v($x as StaticType);
      } catch (e) {
        if (e instanceof ParseError) {
          // Rebase each issue path under `base`
          const rebased = (e.issues ?? []).map(i => ({
            ...i,
            path: i.path === ""
              ? base
              : (base === "" ? i.path : (base + i.path) as JSONPointer),
          }));
          throw new ParseError(rebased);
        }
        // Non-ParseError → wrap with proper path
        const message = e && typeof (e as any).message === "string"
          ? (e as any).message
          : String(e);
        throw new ParseError([{
          input: x,
          message,
          path: base,
        }]);
      }

    }
    return $x as never;
  }
}
