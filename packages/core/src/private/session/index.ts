import type Config from "#session/Config";
import configSchema from "#session/schema";
import type SessionFacade from "#session/SessionFacade";
import local_storage from "#session/storage";
import s_config from "#symbol/config";

interface Schema<T> { parse(input: unknown): T }

type InferSchema<S> = S extends
  { parse(input: unknown): infer T } ? T : unknown;

// schema provided: infer T
export default function session<S extends Schema<any>>(
  config: { schema: S } & Partial<Config>
): SessionFacade<InferSchema<S>>;

// Schema omitted: T = unknown
export default function session(
  config?: Omit<Partial<Config>, "schema">
): SessionFacade<unknown>;

export default function session<T>(
  config?: Partial<Config> & { schema?: Schema<T> },
): SessionFacade<T> {
  const parsed = configSchema.parse(config ?? {});
  const schema: Schema<T> | undefined = config?.schema;

  // Bind the ALS store to this T (unknown at runtime; fine)
  const storage = local_storage<T>();
  const current = () => {
    const s = storage.getStore();
    if (!s) throw new Error("Session handle not available in this context");
    return s;
  };

  const facade: SessionFacade<T> = {
    get id() {
      return current().id;
    },
    get exists() {
      return current().exists;
    },
    create(initial) {
      current().create(initial);
    },
    get() {
      return current().get();
    },
    try() {
      return current().try();
    },
    set(next) {
      current().set(next);
    },
    destroy() {
      current().destroy();
    },
    get [s_config]() { return { ...parsed, schema }; },
  };

  return facade;
}
