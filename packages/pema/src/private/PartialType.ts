import DefaultType from "#DefaultType";
import error from "#error";
import type Infer from "#Infer";
import ParsedKey from "#ParsedKey";
import ParseError from "#ParseError";
import type ParseIssue from "#ParseIssue";
import type ParseOptions from "#ParseOptions";
import type Partialable from "#Partialable";
import join from "#path/join";
import next from "#path/next";
import type DefaultTrait from "#trait/Default";
import VirtualType from "#VirtualType";
import isDict from "@rcompat/is/dict";
import type Dict from "@rcompat/type/Dict";

type InferPartial<D extends Partialable> = {
  -readonly [K in keyof D]?: NonNullable<Infer<D[K]>>;
};

export default class PartialType<D extends Partialable>
  extends VirtualType<D, InferPartial<D>, "PartialType">
  implements DefaultTrait<InferPartial<D>> {
  #spec: D;

  constructor(spec: D) {
    super();
    this.#spec = spec;
  }

  get name() {
    return "partial" as const;
  }

  get schema() {
    return this.#spec;
  }

  default(value: (() => InferPartial<D>) | InferPartial<D>) {
    return new DefaultType(this, value);
  }

  parse(x: unknown, options: ParseOptions = {}): InferPartial<D> {
    if (!isDict(x)) {
      throw new ParseError(error("object", x, options));
    }

    const input: Dict = x as Dict;
    const out: Dict = {};
    const issues: ParseIssue[] = [];

    for (const key of Object.keys(this.#spec)) {
      // skip missing/undefined keys (partial semantics)
      if (!(key in input) || input[key] === undefined) continue;

      try {
        const parsed = this.#spec[key].parse(input[key], next(key, options));
        if (parsed !== undefined) out[key] = parsed;
      } catch (e) {
        if (e instanceof ParseError) {
          // child already rebased to /<key> via nextOptions -> just collect
          if (e.issues && e.issues.length) {
            issues.push(...e.issues);
          }
        } else {
          // wrap non-ParseError into a properly-pathed issue at /<key>
          const message = e && typeof (e as any).message === "string"
            ? (e as any).message
            : String(e);
          issues.push({
            input: input[key],
            message: message,
            path: join(options[ParsedKey] ?? "", key),
          });
        }
      }
    }

    if (issues.length > 0) {
      throw new ParseError(issues);
    }

    return out as unknown as InferPartial<D>;
  }

  toJSON() {
    return { type: this.name, of: { type: "string" as const } };
  }
}
