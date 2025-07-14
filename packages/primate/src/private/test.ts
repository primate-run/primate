import verbs from "@primate/core/verbs";
import type Dictionary from "@rcompat/type/Dictionary";

export type Body = string | Dictionary<string> | Dictionary<string>[];

export type MockedResponse = {
  status: {
    equals(status: number): void;
  };
  body: {
    equals(body: Body): void;
    includes(body: Body): void;
  };
  headers: {
    includes(headers: Dictionary<string>): void;
    get(header: string): {
      equals(value: string): void;
      includes(value: string): void;
    };
  };
};

type Verb = typeof verbs[number];

export type Tester = (response: MockedResponse) => void;

export type Route = string;

type Test = {
  verb: Verb;
  route: Route;
  tester: Tester;
};

export const tests: Test[] = [];

export default {
  ...Object.fromEntries(verbs.map(verb =>
    [verb, (route: Route, tester: Tester) => {
      tests.push({ verb, route, tester });
    }],
  )),
} as { [K in Verb]: (path: Route, tester: Tester) => void };
