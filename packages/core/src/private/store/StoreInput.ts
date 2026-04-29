import type ForeignKey from "#store/ForeignKey";
import type { AllowedFKType } from "#store/ForeignKey";
import type PrimaryKey from "#store/PrimaryKey";
import type { AllowedPKType } from "#store/PrimaryKey";
import type { Relation } from "#store/relation";
import type { Dict } from "@rcompat/type";
import type { DataKey, Storable } from "pema";

type StoreField =
  | Storable<DataKey>
  | PrimaryKey<AllowedPKType>
  | ForeignKey<AllowedFKType>
  | Relation
  ;

type StoreInput = Dict<StoreField>;

export type { StoreInput as default };
