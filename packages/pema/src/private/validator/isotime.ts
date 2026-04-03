import E from "#errors";
import regex from "#validator/regex";

const ISOTIME = /^T?(?<hour>\d{2}):?(?<minute>\d{2}):?(?<second>\d{2})$/u;

const RANGE = {
  hour: { max: 23, min: 0 },
  minute: { max: 59, min: 0 },
  second: { max: 60, min: 0 },
};

function validator(s: string) {
  return `"${s}" is not a valid ISO time`;
}

export default function isotime(x: string) {
  // check format
  regex(ISOTIME, validator)(x);

  // check range
  const match = ISOTIME.exec(x);
  const g = match!.groups as { hour: string; minute: string; second: string };

  const h = Number(g.hour);
  const m = Number(g.minute);
  const s = Number(g.second);

  const in_range =
    h >= RANGE.hour.min && h <= RANGE.hour.max &&
    m >= RANGE.minute.min && m <= RANGE.minute.max &&
    s >= RANGE.second.min && s <= RANGE.second.max;

  if (!in_range) throw E.out_of_range(x, validator(x));
};
