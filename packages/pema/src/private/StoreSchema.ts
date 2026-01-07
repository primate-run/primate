import type Storable from "#Storable";

type StoreSchema = { [k: string]: Storable } & { id: Storable };

export type { StoreSchema as default };
