import type MaybePromise from "@rcompat/type/MaybePromise";

export default abstract class SessionManager<Data> {
  init?(): MaybePromise<void> { }

  abstract load(id: string): MaybePromise<Data | undefined>;

  abstract create(id: string, data: Data): MaybePromise<void>;

  abstract save(id: string, data: Data): MaybePromise<void>;

  abstract destroy(id: string): MaybePromise<void>;
}
