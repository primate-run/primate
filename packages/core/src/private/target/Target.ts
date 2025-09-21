import type BuildApp from "#BuildApp";
import type MaybePromise from "@rcompat/type/MaybePromise";

export default interface Target {
  name: string;
  runner: (app: BuildApp) => MaybePromise<void>;
  target: string;
};
