/** A helper function to encourage type safety when working with wasm pointers,
 * tagging them as a specific type. */
type Tagged<Name, T> = { _tag: Name } & T;

export type { Tagged as default };
