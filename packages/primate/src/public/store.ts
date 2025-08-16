import Store from "@primate/core/database/Store";
import type StoreSchema from "pema/StoreSchema";

export default <S extends StoreSchema>(schema: S) => new Store(schema);
