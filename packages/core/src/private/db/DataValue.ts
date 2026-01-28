import type DataKey from "#db/DataKey";
import type { DataType } from "pema";

type Scalar = DataType[DataKey] | null;

type OperatorObject = Partial<{
  $like: string;
  $ilike: string;

  $gt: number | bigint;
  $gte: number | bigint;
  $lt: number | bigint;
  $lte: number | bigint;

  $before: Date;
  $after: Date;

  $ne: DataType[DataKey];
}>;

type DataValue = Scalar | OperatorObject;

export type { DataValue as default };
