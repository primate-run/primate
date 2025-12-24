import io from "@rcompat/io";
import cache from "@rcompat/kv/cache";

const s = Symbol("primate/i18n");

export default () => cache.get(s, () => new io.async.Context<any>());
