import type Database from "#database/Database";
import type MaybePromise from "@rcompat/type/MaybePromise";
import type Dict from "@rcompat/type/Dict";

export default abstract class Module {
  abstract init(): MaybePromise<Database>;
  abstract deinit(): MaybePromise<void>;
}
