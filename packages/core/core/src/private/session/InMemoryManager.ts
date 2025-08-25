import type SessionData from "#session/Data";
import SessionManager from "#session/Manager";
import Session from "#session/Session";

const generate_id = () => crypto.randomUUID();

type Id = ReturnType<typeof generate_id>;

class InMemorySessionManager<Data extends SessionData>
  extends SessionManager<Id, Data> {
  #sessions = new Map<Id, Session<Id, Data>>();

  get(id: Id) {
    const session = this.#sessions.get(id);

    if (session === undefined) {
      // creates a non-commited session
      return new Session<Id, Data>(this, generate_id());
    }

    return session;
  }

  create(session: Session<Id, Data>) {
    this.#sessions.set(session.id, session);
  }

  destroy(session: Session<Id, Data>) {
    this.#sessions.delete(session.id);
  }

  // noop
  commit() {}
}

export default InMemorySessionManager;
