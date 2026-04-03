import type UUIDType from "#UUIDType";
import type UUIDV4Type from "#UUIDV4Type";
import type UUIDV7Type from "#UUIDV7Type";
import test from "#test";
import uuid from "#uuid";

const valid_uuid = "4d0996db-bda9-4f95-ad7c-7075b10d4ba6";
const valid_uuid_v4 = "4d0996db-bda9-4f95-ad7c-7075b10d4ba6";
const valid_uuid_v7 = "01932b6e-5a2f-7e4f-9a3b-4f6d2c8b1a0e";

test.case("uuid", assert => {
  assert(uuid).type<UUIDType>();
  assert(uuid.parse(valid_uuid)).equals(valid_uuid).type<string>();
  assert(uuid).invalid_format(["not-a-uuid", 123, null]);
});

test.case("uuid.v4", assert => {
  const v4 = uuid.v4();
  assert(v4).type<UUIDV4Type>();
  assert(v4.parse(valid_uuid_v4)).equals(valid_uuid_v4).type<string>();
  assert(v4).invalid_format([valid_uuid_v7, "not-a-uuid", 123]);
});
test.case("uuid.v7", assert => {
  const v7 = uuid.v7();
  assert(v7).type<UUIDV7Type>();
  assert(v7.parse(valid_uuid_v7)).equals(valid_uuid_v7).type<string>();
  assert(v7).invalid_format([valid_uuid_v4, "not-a-uuid", 123]);
});

test.case("uuid.default", assert => {
  const d = uuid.default("4d0996db-bda9-4f95-ad7c-7075b10d4ba6");
  assert(d.parse(undefined)).equals("4d0996db-bda9-4f95-ad7c-7075b10d4ba6")
    .type<string>();
  assert(d.parse(valid_uuid)).equals(valid_uuid).type<string>();
});

test.case("uuid.optional", assert => {
  const o = uuid.optional();
  assert(o.parse(undefined)).equals(undefined);
  assert(o.parse(valid_uuid)).equals(valid_uuid);
});

test.case("toJSON", assert => {
  assert(uuid.toJSON())
    .type<{ type: "string"; datatype: "uuid" }>()
    .equals({ type: "string", datatype: "uuid" });
  assert(uuid.v4().toJSON())
    .type<{ type: "string"; datatype: "uuid_v4" }>()
    .equals({ type: "string", datatype: "uuid_v4" });
  assert(uuid.v7().toJSON())
    .type<{ type: "string"; datatype: "uuid_v7" }>()
    .equals({ type: "string", datatype: "uuid_v7" });
});
