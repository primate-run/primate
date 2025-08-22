import ParseError from "#ParseError";
import join from "#path/join";

export default function unique<T>(array: Array<T>) {
  const seen = new Map<T, number>();

  for (let i = 0; i < array.length; i++) {
    const v = array[i];
    if (seen.has(v)) {
      const first = seen.get(v)!;
      // key = current duplicate index
      throw new ParseError([{
        input: array,
        message: `duplicate value at index ${i} (first seen at ${first})`,
        path: join("", i),
      }]);
    }
    seen.set(v, i);
  }
}
