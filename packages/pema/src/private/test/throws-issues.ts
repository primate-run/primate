import type ParseError from "#ParseError";
import type ParseIssue from "#ParseIssue";
import type Asserter from "@rcompat/test/Asserter";

export default function throwsIssues(assert: Asserter, fn: () => unknown): ParseIssue[] {
  try {
    fn();
    // fail if nothing was thrown
    assert().fail();
    return []; // unreachable
  } catch (error) {
    const e = error as ParseError;
    return e.issues ?? [];
  }
}
