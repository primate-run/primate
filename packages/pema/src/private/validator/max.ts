import fail from "#error/fail";
import schemafail from "#error/schemafail";
import type Validator from "#Validator";
import isFinite from "@rcompat/is/finite";

type Lengthed = { length: number };
type Limit = bigint | number;
type Input = bigint | number | string | unknown[];

export default function max(limit: Limit): Validator<Input> {
  // validate limit once
  if (typeof limit === "number") {
    if (!isFinite(limit)) {
      throw schemafail("max: limit {0} must be a finite number", limit);
    }

    return (x: unknown) => {
      if (typeof x === "number") {
        if (x > limit) throw fail(x, `${x} is greater than max (${limit})`);
      } else if (typeof x === "string" || Array.isArray(x)) {
        if ((x as Lengthed).length > limit) {
          const unit = typeof x === "string" ? "characters" : "items";
          throw fail(x, `max ${limit} ${unit}`);
        }
      } else {
        throw fail(x, "invalid type");
      }
    };
  }

  // bigint
  return (x: unknown) => {
    if (typeof x === "bigint") {
      if (x > limit) throw fail(x, `${x} is greater than max (${limit})`);
    } else {
      throw fail(x, "invalid type");
    }
  };
}
