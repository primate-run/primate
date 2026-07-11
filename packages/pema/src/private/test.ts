import type IssueType from "#IssueType";
import ParseError from "#ParseError";
import is from "@rcompat/is";
import test from "@rcompat/test";
import type { JSONPointer } from "@rcompat/type";

type Input = [unknown, string?];
type IssueMatcher = {
  type: IssueType;
  path?: string;
  message?: string;
};
type Parseable = {
  parse(x: unknown): unknown;
};
type Shortcuts = {
  [K in IssueType]: (inputs: unknown[], path?: JSONPointer) => void;
};

const issue_types: IssueType[] = [
  "invalid_type",
  "invalid_format",
  "too_small",
  "too_large",
  "out_of_range",
  "not_in_set",
  "duplicate",
];

export default test.extend((assert, subject: Parseable) => {
  const parse_issue = (type: IssueType, inputs: Input[]) => {
    for (const [input, path] of inputs) {
      try {
        subject.parse(input);
        assert("[did not throw]").equals("[threw]");
      } catch (e) {
        if (ParseError.is(e)) {
          const issue = e.issues[0];
          assert(issue.type).equals(type);
          if (is.defined(path)) assert(issue.path).equals(path);
        } else {
          throw e;
        }
      }
    }
  };

  const shortcuts = Object.fromEntries(
    issue_types.flatMap(type => [
      [type, (inputs: unknown[], path: JSONPointer = "") =>
        parse_issue(type, inputs.map(input => [input, path] as Input))],
    ]),
  );

  return {
    parse_issue,
    parse_issues(input: unknown, matchers: IssueMatcher[]) {
      try {
        subject.parse(input);
        assert("[did not throw]").equals("[threw]");
      } catch (e) {
        if (ParseError.is(e)) {
          assert(e.issues.length).equals(matchers.length);
          for (let i = 0; i < matchers.length; i++) {
            assert(e.issues[i].type).equals(matchers[i].type);
            if (is.defined(matchers[i].path)) {
              assert(e.issues[i].path).equals(matchers[i].path);
            }
            if (is.defined(matchers[i].message)) {
              assert(e.issues[i].message).equals(matchers[i].message);
            }
          }
        } else {
          throw e;
        }
      }
    },
    ...shortcuts,
  } as {
    parse_issue: typeof parse_issue;
    parse_issues(input: unknown, matchers: IssueMatcher[]): void;
  } & Shortcuts;
});
