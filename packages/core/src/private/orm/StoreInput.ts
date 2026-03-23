import type ForeignKey from "#orm/ForeignKey";
import type { AllowedFKType } from "#orm/ForeignKey";
import type PrimaryKey from "#orm/PrimaryKey";
import type { AllowedPKType } from "#orm/PrimaryKey";
import type { Dict } from "@rcompat/type";
import type { DataKey, Storable } from "pema";

type StoreField =
  | Storable<DataKey>
  | PrimaryKey<AllowedPKType>
  | ForeignKey<AllowedFKType>;

type StoreInput = Dict<StoreField>;

export type { StoreInput as default };
