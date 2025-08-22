import ParseError from "#ParseError";
import join from "#path/join";

function message(k: PropertyKey, i: number, first: number) {
  return `duplicate key "${String(k)}" at index ${i} (first ${first})`;
}

export default function uniqueBy<T, K extends PropertyKey>(
  selector: (item: T) => K,
) {
  return (array: Array<T>) => {
    const seen = new Map<K, number>();
    for (let i = 0; i < array.length; i++) {
      const k = selector(array[i]);
      if (seen.has(k)) {
        const first = seen.get(k)!;
        throw new ParseError([{
          input: array,
          message: message(k, i, first),
          path: join("", i),
        }]);
      }
      seen.set(k, i);
    }
  };
}
