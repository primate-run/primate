import PrimaryKey from "#orm/PrimaryKey";
import type { DataKey, Storable } from "pema";

export default function primary<T extends Storable<DataKey>>(type: T):
  PrimaryKey<T> {
  return new PrimaryKey(type);
}
