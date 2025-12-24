import type SessionHandle from "#session/SessionHandle";
import io from "@rcompat/io";
import cache from "@rcompat/kv/cache";

const s = Symbol("primate.session");

export default <Data>() =>
  cache.get(s, () => new io.async.Context<SessionHandle<Data>>());
