import type RequestFacade from "#request/RequestFacade";
import io from "@rcompat/io";
import cache from "@rcompat/kv/cache";

const s = Symbol("primate.request");

export default () => cache.get(s, () => new io.async.Context<RequestFacade>());
