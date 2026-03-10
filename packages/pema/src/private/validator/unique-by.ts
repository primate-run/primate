import ParseError from "#ParseError";
import join from "#path/join";

export default function uniqueBy<T, K>(select: (value: T) => K) {
  return (array: T[]) => {
    const seen = new Map<K, number>();

    for (let i = 0; i < array.length; i++) {
      const value = array[i];
      const key = select(value);

      if (seen.has(key)) {
        const first = seen.get(key)!;
        throw new ParseError([{
          input: array,
          message: `duplicate value at index ${i} (first seen at ${first})`,
          path: join("", i),
        }]);
      }

      seen.set(key, i);
    }
  };
}
