import type UUIDType from "#UUIDType";
import type UUIDV4Type from "#UUIDV4Type";
import type UUIDV7Type from "#UUIDV7Type";
import p from "#index";
import test from "#test";

const valid_uuid = "4d0996db-bda9-4f95-ad7c-7075b10d4ba6";
const valid_uuid_v4 = "4d0996db-bda9-4f95-ad7c-7075b10d4ba6";
const valid_uuid_v7 = "01932b6e-5a2f-7e4f-9a3b-4f6d2c8b1a0e";

test.case("p.uuid", assert => {
  assert(p.uuid).type<UUIDType>();
  assert(p.uuid.parse(valid_uuid)).equals(valid_uuid).type<string>();
  assert(p.uuid).invalid_format(["not-a-p.uuid", 123, null]);
});

test.case("p.uuid.v4", assert => {
  const v4 = p.uuid.v4();
  assert(v4).type<UUIDV4Type>();
  assert(v4.parse(valid_uuid_v4)).equals(valid_uuid_v4).type<string>();
  assert(v4).invalid_format([valid_uuid_v7, "not-a-p.uuid", 123]);
});
test.case("p.uuid.v7", assert => {
  const v7 = p.uuid.v7();
  assert(v7).type<UUIDV7Type>();
  assert(v7.parse(valid_uuid_v7)).equals(valid_uuid_v7).type<string>();
  assert(v7).invalid_format([valid_uuid_v4, "not-a-uuid", 123]);
});

test.case("p.uuid.default", assert => {
  const d = p.uuid.default("4d0996db-bda9-4f95-ad7c-7075b10d4ba6");
  assert(d.parse(undefined)).equals("4d0996db-bda9-4f95-ad7c-7075b10d4ba6")
    .type<string>();
  assert(d.parse(valid_uuid)).equals(valid_uuid).type<string>();
});

test.case("p.uuid.optional", assert => {
  const o = p.uuid.optional();
  assert(o.parse(undefined)).equals(undefined);
  assert(o.parse(valid_uuid)).equals(valid_uuid);
});

test.case("toJSON", assert => {
  assert(p.uuid.toJSON())
    .type<{ type: "string"; datatype: "uuid" }>()
    .equals({ type: "string", datatype: "uuid" });
  assert(p.uuid.v4().toJSON())
    .type<{ type: "string"; datatype: "uuid_v4" }>()
    .equals({ type: "string", datatype: "uuid_v4" });
  assert(p.uuid.v7().toJSON())
    .type<{ type: "string"; datatype: "uuid_v7" }>()
    .equals({ type: "string", datatype: "uuid_v7" });
});
