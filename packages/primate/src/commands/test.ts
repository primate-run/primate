import { tests, type Body, type MockedResponse } from "#test";
import build from "@primate/core/build";
import green from "@rcompat/cli/color/green";
import red from "@rcompat/cli/color/red";
import root from "@rcompat/package/root";
import type Dictionary from "@rcompat/record/Dictionary";
import equals from "@rcompat/test/equals";
import includes from "@rcompat/test/includes";
import type MaybePromise from "pema/MaybePromise";
import serve from "./serve.js";
import entries from "@rcompat/record/entries";

const directory  = "test";

type Check<T> = () => MaybePromise<[boolean, T, T]>;

const fetch_options = { redirect: "manual" } as const;

export default async () => {
  await build("production", "web");
  const app = (await serve()).default;

  const files = await (await root()).join(directory)
    .list(path => path.endsWith(".ts") || path.endsWith(".js"), {})

  // side effects
  await Promise.all(files.map(file => file.import()));

  for (const test of tests) {
    const response = await fetch(`${app.url}${test.route}`, fetch_options);

    const checks: Check<Body | number>[] = [];

    const mocked_response: MockedResponse = {
      status: {
        equals(status) {
          checks.push(() => {
            return [response.status === status, status, response.status];
          })
        },
      },
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
            return [includes(actual, expected), expected, actual];
          });
        },
      },
      headers: {
        includes(expected: Dictionary<string>) {
          checks.push(() => {
            const actual = Object.fromEntries(response.headers.entries());
            const lowercased = entries(expected)
              .keymap(([key]) => key.toLowerCase()).get();
            return [includes(actual, lowercased), lowercased, actual];
          });
        }
      },
    };
    test.tester(mocked_response);

    const results = await Promise.all(checks.map(check => check()));

    const failed = results.find(result => !result[0]);
    const verb = test.verb.toUpperCase();

    if (failed !== undefined) {
      console.log(red(`${verb} ${test.route}`));
      console.log(`expected: ${JSON.stringify(failed[1])}`);
      console.log(`actual: ${JSON.stringify(failed[2])}`);
    } else {
      console.log(green(`${verb} ${test.route}`));
    }
  }

  await app.stop();
}
