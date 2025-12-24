import type DataKey from "#database/DataKey";
import type { DataType } from "pema";

type DataValue = DataType[DataKey] | null;

export type { DataValue as default };
