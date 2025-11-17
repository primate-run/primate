import { tests, type Body, type MockedResponse } from "#test";
import build from "@primate/core/build";
import green from "@rcompat/cli/color/green";
import red from "@rcompat/cli/color/red";
import root from "@rcompat/fs/project/root";
import entries from "@rcompat/record/entries";
import equals from "@rcompat/test/equals";
import includes from "@rcompat/test/includes";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";
import serve from "./serve.js";

const directory = "test";

type Check<T> = () => MaybePromise<[boolean, T, null | T]>;

const fetch_options = { redirect: "manual" } as RequestInit;

const first_error = (left: string, right: string) => {
  const length = left.length > right.length ? right.length : left.length;

  for (let i = 0; i < length; i++) {
    if (left[i] !== right[i]) {
      return i;
    }
  }
};

export default async () => {
  await build({ mode: "testing" });
  const app = (await serve()).default;

  const files = await (await root()).join(directory)
    .list(({ path }) => path.endsWith(".ts") || path.endsWith(".js"));

  // side effects
  await Promise.all(files.map(file => file.import()));

  for (const test of tests) {
    let init: Request;
    let path: string;
    const route = test.route;

    if (typeof route === "string") {
      path = route;
      init = new Request(`${app.url}${route}`);
    } else {
      path = route.url.replace(app.url, "");
      init = new Request(route.url, {
        body: route.body,
        // @ts-expect-error nonsense
        duplex: "half",
        headers: route.headers,
        method: route.method,
      });
    }

    const response = await fetch(init, fetch_options);

    const checks: Check<Body | number>[] = [];

    const mocked_response: MockedResponse = {
      body: {
        equals(expected: Body) {
          checks.push(async () => {
            const actual = await (typeof expected === "string"
              ? response.text()
              : response.json());
            return [equals(actual, expected), expected, actual];
          });
        },
        includes(expected: Body) {
          checks.push(async () => {
            const actual = await (typeof expected === "string"
              ? response.text()
              : response.json());
            const $expected = typeof expected === "string"
              ? expected.replaceAll("\n", "").replaceAll("  ", "")
              : expected;
            return [includes(actual, $expected), $expected, actual];
          });
        },
      },
      headers: {
        get(name: string) {
          const actual = response.headers.get(name);

          return {
            equals(expected: string) {
              checks.push(() => {
                return [equals(actual, expected), expected, actual];
              });
            },
            includes(expected: string) {
              checks.push(() => {
                return [includes(actual, expected), expected, actual];
              });
            },
          };
        },
        includes(expected: Dict<string>) {
          checks.push(() => {
            const actual = Object.fromEntries(response.headers.entries());
            const lowercased = entries(expected)
              .keymap(([key]) => key.toLowerCase()).get();
            return [includes(actual, lowercased), lowercased, actual];
          });
        },
      },
      status: {
        equals(status) {
          checks.push(() => {
            return [response.status === status, status, response.status];
          });
        },
      },
    };
    test.tester(mocked_response);

    const results = await Promise.all(checks.map(async check => {
      try {
        return await check();
      } catch (error) {
        console.log(error);
        return [
          false, "()", "test execution failed",
        ];
      }
    }));

    const failed = results.find(result => !result[0]);
    const verb = test.verb.toUpperCase();

    if (failed !== undefined) {
      const routeText = typeof test.route === "string"
        ? test.route
        : new URL(test.route.url).pathname;
      console.log(red(`${verb} ${routeText}`));
      const expected = JSON.stringify(failed[1]);
      const actual = JSON.stringify(failed[2]);
      const n = first_error(expected, actual)!;
      console.log(`expected: ${expected.slice(0, n)}${green(expected[n])}${expected.slice(n + 1)}`);
      console.log(`actual:   ${actual.slice(0, n)}${red(actual[n])}${actual.slice(n + 1)}`);
    } else {
      console.log(green(`${verb} ${path}`));
    }
  }

  await app.stop();
};
