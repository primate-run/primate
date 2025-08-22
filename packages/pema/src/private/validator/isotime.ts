import ParseError from "#ParseError";
import regex from "#validator/regex";

const ISOTIME = /^T?(?<hour>\d{2}):?(?<minute>\d{2}):?(?<second>\d{2})$/u;

const RANGE = {
  hour: { max: 23, min: 0 },
  minute: { max: 59, min: 0 },
  second: { max: 60, min: 0 },
};

export default function isotime(x: string) {
  // check format
  regex(ISOTIME, y => `"${y}" is not a valid ISO time`)(x);

  // check range
  const match = ISOTIME.exec(x);
  const g = match!.groups as { hour: string; minute: string; second: string };

  const h = Number(g.hour);
  const m = Number(g.minute);
  const s = Number(g.second);

  const inRange =
    h >= RANGE.hour.min && h <= RANGE.hour.max &&
    m >= RANGE.minute.min && m <= RANGE.minute.max &&
    s >= RANGE.second.min && s <= RANGE.second.max;

  if (!inRange) {
    throw new ParseError([{
      input: x,
      message: `"${x}" is not a valid ISO time`,
      path: "",
    }]);
  }
};
