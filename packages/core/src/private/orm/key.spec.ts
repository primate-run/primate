import key from "#orm/key";
import ForeignKey from "#orm/ForeignKey";
import PrimaryKey from "#orm/PrimaryKey";
import p from "pema";
import test from "@rcompat/test";

test.case("primary - creates PrimaryKey", assert => {
  const pk = key.primary(p.string);

  assert(pk instanceof PrimaryKey).true();
  assert(pk.name).equals("string");
  assert(pk.datatype).equals("string");
  assert(pk.nullable).equals(false);
});

test.case("primary - numeric types", assert => {
  const u16 = key.primary(p.u16);
  assert(u16.datatype).equals("u16");

  const u32 = key.primary(p.u32);
  assert(u32.datatype).equals("u32");

  const u64 = key.primary(p.u64);
  assert(u64.datatype).equals("u64");
});

test.case("primary - exposes underlying type", assert => {
  const pk = key.primary(p.string);

  assert(pk.type).equals(p.string);
});

test.case("foreign - creates ForeignKey", assert => {
  const fk = key.foreign(p.string);

  assert(fk instanceof ForeignKey).true();
  assert(fk.name).equals("string");
  assert(fk.datatype).equals("string");
  assert(fk.nullable).equals(false);
});

test.case("foreign - nullable when optional", assert => {
  const fk = key.foreign(p.string.optional());

  assert(fk.nullable).equals(true);
});

test.case("foreign - exposes underlying type", assert => {
  const fk = key.foreign(p.u32);

  assert(fk.type).equals(p.u32);
});
