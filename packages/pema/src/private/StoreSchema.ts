import type Storeable from "#Storeable";

type StoreSchema = { [k: string]: Storeable } & { id: Storeable };

export type { StoreSchema as default };
