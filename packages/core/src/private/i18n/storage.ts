import AsyncLocalStorage from "@rcompat/async/context";
import cache from "@rcompat/kv/cache";

const s = Symbol("primate/i18n");

export default () => cache.get(s, () => new AsyncLocalStorage<any>);
