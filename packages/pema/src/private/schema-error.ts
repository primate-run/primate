import SchemaError from "#SchemaError";
import type { Asserter } from "@rcompat/test";

function fail(strings: TemplateStringsArray, ...params: unknown[]) {
  const message = strings.reduce((acc, str, i) =>
    acc + (i > 0 ? `{${i - 1}}` : "") + str, "");
  return new SchemaError(message, ...params);
}

function coded<T extends Record<string, (...args: any[]) => SchemaError>>(fns: T): T {
  return Object.fromEntries(
    Object.entries(fns).map(([key, fn]) => [
      key,
      (...args: any[]) => {
        const err = fn(...args);
        (err as any).code = key;
        return err;
      },
    ]),
  ) as T;
}

const errors = coded({
  unique_subtype_not_primitive: (subtype: string) =>
    fail`unique: subtype ${subtype} must be primitive`,
  min_negative: (limit: number) =>
    fail`min: ${limit} must be positive`,
  max_negative: (limit: number) =>
    fail`max: ${limit} must be positive`,
  length_not_finite: (from: number, to: number) =>
    fail`length: ${from} and ${to} must be finite numbers`,
  length_not_positive: (from: number, to: number) =>
    fail`length: ${from} and ${to} must be positive`,
  length_from_exceeds_to: (from: number, to: number) =>
    fail`length: ${from} must be lower than ${to}`,
  min_limit_not_finite: (limit: number) =>
    fail`min: limit ${limit} must be a finite number`,
  max_limit_not_finite: (limit: number) =>
    fail`max: limit ${limit} must be a finite number`,
  extend_key_collision: (key: string) =>
    fail`extend: key ${key} already exists and cannot be overridden`,
});

export type Code = keyof typeof errors;

export const Code = Object.fromEntries(
  Object.keys(errors).map(k => [k, k]),
) as { [K in Code]: K };

export function throws(assert: Asserter, code: Code, fn: any) {
  try {
    fn();
    assert(false).true();
  } catch (error) {
    assert((error as any).code).equals(code);
  }
}

export default errors;
