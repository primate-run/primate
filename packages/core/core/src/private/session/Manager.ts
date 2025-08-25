import type Session from "#session/Session";
import type MaybePromise from "@rcompat/type/MaybePromise";

export default abstract class SessionManager<Id extends string, Data> {
  // init the session manager, potentially loading previously-saved data
  init(): void {
    // noop by default
  };

  abstract get(id: Id): Session<Id, Data>;

  abstract create(session: Session<Id, Data>): void;

  abstract destroy(session: Session<Id, Data>): void;

  abstract commit(): MaybePromise<void>;
};
