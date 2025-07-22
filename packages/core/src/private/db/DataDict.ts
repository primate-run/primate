import type DataType from "pema/DataType";
import type Dict from "@rcompat/type/Dict";

type DataKey = keyof DataType;
type DataValue = DataType[DataKey];
type DataDict = Dict<DataValue>;

export type { DataDict as default };
