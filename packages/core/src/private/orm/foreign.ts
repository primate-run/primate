import ForeignKey from "#orm/ForeignKey";
import type { DataKey, Storable } from "pema";

export default function foreign<T extends Storable<DataKey>>(type: T): ForeignKey<T> {
  return new ForeignKey(type);
}
