import ParseError from "#ParseError";
import join from "#path/join";

export default function uniqueWith<T>(equals: (a: T, b: T) => boolean) {
  return (array: Array<T>) => {
    for (let i = 0; i < array.length; i++) {
      for (let j = 0; j < i; j++) {
        if (equals(array[i], array[j])) {
          throw new ParseError([{
            input: array,
            message: `items at ${j} and ${i} considered equal`,
            path: join("", i),
          }]);
        }
      }
    }
  };
}
