import regex from "#validator/regex";

const _isotime = /^T?(?<hour>\d{2}):?(?<minute>\d{2}):?(?<second>\d{2})$/u;

const _range = {
  hour: 24,
  minute: 59,
  second: 60,
};

const check = (_time: string) => {
  try {
    /*const { groups } = isotime.exec(time)!;
    return Object.entries(groups).reduce((valid, [name, unit]) =>
      valid && (value => value > 0
      && value <= range[name as keyof Range])(unit), true);*/
    return true;
  } catch {
    return false;
  }
};

export default (x: string) => {
  if (!check(x)) {
    throw new Error(`"${x} is not a valid ${regex}`);
  }
};
