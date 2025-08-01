import verbs from "@primate/core/verbs";
import type Dict from "@rcompat/type/Dict";

export type Body = Dict | Dict[] | string;

export type MockedResponse = {
  body: {
    equals(body: Body): void;
    includes(body: Body): void;
  };
  headers: {
    get(header: string): {
      equals(value: string): void;
      includes(value: string): void;
    };
    includes(headers: Dict<string>): void;
  };
  status: {
    equals(status: number): void;
  };
};

type Verb = typeof verbs[number];

type Tester = (response: MockedResponse) => void;

type Route = string;

type Test = {
  route: Route;
  tester: Tester;
  verb: Verb;
};

export const tests: Test[] = [];

export default {
  ...Object.fromEntries(verbs.map(verb =>
    [verb, (route: Route, tester: Tester) => {
      tests.push({ route, tester, verb });
    }],
  )),
} as { [K in Verb]: (path: Route, tester: Tester) => void };
