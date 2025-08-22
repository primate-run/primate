import type Issue from "#Issue";

export default interface ParseIssue extends Issue {
  input: unknown;
}
