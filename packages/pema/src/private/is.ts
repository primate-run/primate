import IsType from "#IsType";

const vanilla = <T>(predicate: (x: unknown) => x is T) => new IsType(predicate);

const loose = <T>(predicate: (x: unknown) => x is T) => {
  return new IsType(predicate);
};

const strict = <T>(predicate: (x: unknown) => x is T) => {
  return new IsType(predicate);
};

const is = { vanilla, loose, strict };

export default is;
