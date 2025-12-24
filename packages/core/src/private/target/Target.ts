import type App from "#App";
import type { MaybePromise } from "@rcompat/type";

export default interface Target {
  name: string;
  runner: (app: App) => MaybePromise<void>;
  target: string;
};
