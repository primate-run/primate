import backend from "#backend";
import frontend from "#frontend";
import setup from "#setup";
import template from "#template";
import type { Asserter } from "@rcompat/test";
import runner from "@rcompat/test";

type Case = (name: string, fn: (assert: Asserter) => Promise<void>) => void;
type Ended = (fn: () => Promise<void>) => void;

type Test = {
  frontend: typeof frontend;
  backend: typeof backend;
  template: typeof template;
  setup: typeof setup;
  case: Case;
  ended: Ended;
};

const test: Test = {
  backend,
  frontend,
  template,
  setup,
  case: runner.case,
  ended: runner.ended,
};

export default test;
