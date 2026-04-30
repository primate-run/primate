import is from "@rcompat/is";
import symbol from "@rcompat/symbol";

const { parse } = symbol;

export default function resolve(x: unknown): unknown {
  return is.object(x) && parse in x ? (x as any)[parse]() : x;
}
