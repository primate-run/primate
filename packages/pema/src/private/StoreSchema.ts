import type Storeable from "#Storeable";

type StoreSchema = { id: Storeable } & { [k: string]: Storeable };

export type { StoreSchema as default };
