import E from "#errors";
import message from "#validator/message";
import type MessageOptions from "#validator/MessageOptions";
import regex from "#validator/regex";

const ISOTIME = /^T?(?<hour>\d{2}):?(?<minute>\d{2}):?(?<second>\d{2})$/u;

const RANGE = {
  hour: { max: 23, min: 0 },
  minute: { max: 59, min: 0 },
  second: { max: 60, min: 0 },
};

const fallback = (s: string) => `"${s}" is not a valid ISO time`;

export default function isotime(options?: MessageOptions<string>) {
  const format = message(options, fallback);

  return (x: string) => {
    // check format
    regex(ISOTIME, format)(x);

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

    if (!in_range) throw E.out_of_range(x, format(x));
  };
};
