import verbs from "@primate/core/verbs";
import type Dict from "@rcompat/type/Dict";

export type Body = string | Dict<string> | Dict<string>[];

export type MockedResponse = {
  status: {
    equals(status: number): void;
  };
  body: {
    equals(body: Body): void;
    includes(body: Body): void;
  };
  headers: {
    includes(headers: Dict<string>): void;
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
