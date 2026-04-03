import E from "#errors";
import join from "#path/join";

export default function unique_by<T, K>(select: (value: T) => K) {
  return (array: T[]) => {
    const seen = new Map<K, number>();

    for (let i = 0; i < array.length; i++) {
      const value = array[i];
      const key = select(value);

      if (seen.has(key)) {
        const first = seen.get(key)!;
        throw E.duplicate(array,
          `duplicate value at index ${i} (first seen at ${first})`,
          join("", i));
      }

      seen.set(key, i);
    }
  };
}
