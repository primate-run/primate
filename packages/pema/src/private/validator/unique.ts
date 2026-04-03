import E from "#errors";
import join from "#path/join";

export default function unique<T>(array: Array<T>) {
  const seen = new Map<T, number>();

  for (let i = 0; i < array.length; i++) {
    const v = array[i];
    if (seen.has(v)) {
      const first = seen.get(v)!;
      // key = current duplicate index
      throw E.duplicate(array,
        `duplicate value at index ${i} (first seen at ${first})`,
        join("", i),
      );
    }
    seen.set(v, i);
  }
}
