import IsType from "#IsType";
import Loose from "#Loose";

const vanilla = <T>(predicate: (x: unknown) => x is T) => new IsType(predicate);

const loose = <T>(predicate: (x: unknown) => x is T) => {
  const i = new IsType(predicate);
  i[Loose] = true;
  return i;
};

const strict = <T>(predicate: (x: unknown) => x is T) => {
  const i = new IsType(predicate);
  i[Loose] = false;
  return i;
};

const is = { vanilla, loose, strict };

export default is;
