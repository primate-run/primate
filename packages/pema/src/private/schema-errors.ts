import error from "@rcompat/error";

const t = error.template;

const errors = error.coded({
  unique_subtype_not_primitive: (subtype: string) =>
    t`unique: subtype ${subtype} must be primitive`,
  min_negative: (limit: number) =>
    t`min: ${limit} must be positive`,
  max_negative: (limit: number) =>
    t`max: ${limit} must be positive`,
  length_not_finite: (from: number, to: number) =>
    t`length: ${from} and ${to} must be finite numbers`,
  length_not_positive: (from: number, to: number) =>
    t`length: ${from} and ${to} must be positive`,
  length_from_exceeds_to: (from: number, to: number) =>
    t`length: ${from} must be lower than ${to}`,
  min_limit_not_finite: (limit: number) =>
    t`min: limit ${limit} must be a finite number`,
  max_limit_not_finite: (limit: number) =>
    t`max: limit ${limit} must be a finite number`,
  extend_key_collision: (key: string) =>
    t`extend: key ${key} already exists and cannot be overridden`,
  union_at_least_two_members: () =>
    t`union type must have at least two members`,
});

export type Code = keyof typeof errors;
export const Code = Object.fromEntries(
  Object.keys(errors).map(k => [k, k]),
) as { [K in Code]: K };
export default errors;
