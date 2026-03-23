import ForeignKey from "#orm/ForeignKey";
import key from "#orm/key";
import PrimaryKey from "#orm/PrimaryKey";
import test from "@rcompat/test";
import p from "pema";

test.case("primary - creates PrimaryKey", assert => {
  const pk = key.primary(p.uuid);

  assert(pk instanceof PrimaryKey).true();
  assert(pk.name).equals("string");
  assert(pk.datatype).equals("uuid");
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
  const pk = key.primary(p.uuid);

  assert(pk.type).equals(p.uuid);
});

test.case("foreign - creates ForeignKey", assert => {
  const fk = key.foreign(p.uuid);

  assert(fk instanceof ForeignKey).true();
  assert(fk.name).equals("string");
  assert(fk.datatype).equals("uuid");
  assert(fk.nullable).equals(false);
});

test.case("foreign - nullable when optional", assert => {
  const fk = key.foreign(p.uuid.optional());

  assert(fk.nullable).equals(true);
});

test.case("foreign - exposes underlying type", assert => {
  const fk = key.foreign(p.u32);

  assert(fk.type).equals(p.u32);
});
