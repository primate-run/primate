import type Database from "#db/Database";
import type MaybePromise from "@rcompat/type/MaybePromise";

export default abstract class Module {
  abstract init(): MaybePromise<Database>;
  abstract deinit(): MaybePromise<void>;
}
