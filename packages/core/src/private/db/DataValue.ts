import type DataKey from "#db/DataKey";
import type { DataType } from "pema";

type DataValue = DataType[DataKey] | null;

export type { DataValue as default };
