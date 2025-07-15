import UnionType from "#UnionType";
import type Schema from "#Schema";

import type NormalizeSchema from "#NormalizeSchema";

type NormalizeSchemas<T extends Schema[]> = {
  [K in keyof T]: NormalizeSchema<T[K]>
};

export default <const T extends Schema[]>(...types: T):
UnionType<NormalizeSchemas<T>> => new UnionType(types) as never;
