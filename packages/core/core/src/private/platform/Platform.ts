import type App from "#App";
import type MaybePromise from "@rcompat/type/MaybePromise";

export default interface Platform {
  name: string;
  runner: (app: App) => MaybePromise<void>;
  target: string;
};
