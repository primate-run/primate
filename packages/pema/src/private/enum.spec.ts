import type DefaultType from "#DefaultType";
import type { Enum } from "#EnumType";
import EnumType from "#EnumType";
import p from "#index";
import type OptionalType from "#OptionalType";
import { Code } from "#schema-errors";
import test from "#test";

const Status = p.enum({ UNCONFIRMED: 0, CONFIRMED: 1 });
type Status = typeof Status.infer;

const StatusLoose = p.loose.enum({ UNCONFIRMED: 0, CONFIRMED: 1 });
const StatusStrict = p.strict.enum({ UNCONFIRMED: 0, CONFIRMED: 1 });

type StatusValues = { readonly UNCONFIRMED: 0; readonly CONFIRMED: 1 };

test.case("pass", assert => {
  assert(Status).type<Enum<StatusValues>>();
  assert(Status.parse(0)).equals(0).type<Status>();
  assert(Status.parse(1)).equals(1).type<Status>();
});

test.case("fail", assert => {
  assert(Status).invalid_type(["foo", null, undefined, true, {}]);
});

test.case("not in declared set", assert => {
  try {
    Status.parse(2);
    assert("[did not throw]").equals("[threw]");
  } catch (e) {
    assert((e as Error).message).type<string>();
  }
});

test.case("out of u8 range", assert => {
  assert(Status).out_of_range([-1, 256]);
});

test.case("generated constants", assert => {
  assert(Status.UNCONFIRMED).equals(0).type<0>();
  assert(Status.CONFIRMED).equals(1).type<1>();
});

test.case("values", assert => {
  assert(Status.values).equals({ UNCONFIRMED: 0, CONFIRMED: 1 });
});

test.case("nameOf", assert => {
  assert(Status.nameOf(0)).equals("UNCONFIRMED");
  assert(Status.nameOf(1)).equals("CONFIRMED");
});

test.case("datatype", assert => {
  assert(Status.datatype).equals("u8");
});

test.case("invalid key rejected at construction", assert => {
  try {
    p.enum({ unconfirmed: 0 });
    assert("[did not throw]").equals("[threw]");
  } catch (e) {
    assert((e as Error).message).type<string>();
  }
  try {
    p.enum({ Confirmed: 1 });
    assert("[did not throw]").equals("[threw]");
  } catch (e) {
    assert((e as Error).message).type<string>();
  }
});

test.case("frozen", assert => {
  assert(Object.isFrozen(Status)).equals(true);
});

test.case("optional", assert => {
  const o = Status.optional();
  assert(o).type<OptionalType<Enum<StatusValues>>>();
  assert(o.parse(undefined)).equals(undefined);
  assert(o.parse(0)).equals(0);
  assert(o).invalid_type(["foo", 42.5]);
});

test.case("default", assert => {
  [Status.default(0), Status.default(() => 0)].forEach(d => {
    assert(d).type<DefaultType<EnumType<StatusValues, undefined>, 0>>();
    assert(d.parse(undefined)).equals(0).type<Status>();
    assert(d.parse(1)).equals(1).type<Status>();
    assert(d).invalid_type(["foo"]);
  });
});

test.case("toJSON", assert => {
  assert(Status.toJSON()).equals({
    type: "enum",
    datatype: "u8",
    values: { UNCONFIRMED: 0, CONFIRMED: 1 },
  });
});

test.case("loose coerces from string", assert => {
  assert(StatusLoose.parse("0")).equals(0).type<Status>();
  assert(StatusLoose.parse("1")).equals(1).type<Status>();
  assert(StatusLoose).invalid_type(["foo"]);
  assert(StatusLoose).not_in_set(["2"]);
});

test.case("strict rejects numeric strings", assert => {
  assert(StatusStrict).invalid_type(["0", "1"]);
  assert(StatusStrict.parse(0)).equals(0).type<Status>();
});

test.case("array unique", assert => {
  const a = p.array(Status).unique();
  const input = [0, 1];
  assert(a.parse(input)).equals(input);
  assert(a).duplicate([[0, 0]], "/1");
});
