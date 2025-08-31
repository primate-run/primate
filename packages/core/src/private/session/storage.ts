import type SessionHandle from "#session/SessionHandle";
import AsyncLocalStorage from "@rcompat/async/context";
import cache from "@rcompat/kv/cache";

const s = Symbol("primate.session");

export default <Data>() =>
  cache.get(s, () => new AsyncLocalStorage<SessionHandle<Data>>);
