import bigint from "#bigint";
import type BigIntType from "#BigIntType";
import boolean from "#boolean";
import type BooleanType from "#BooleanType";
import schema from "#index";
import type ObjectType from "#ObjectType";
import optional from "#optional";
import type OptionalType from "#OptionalType";
import string from "#string";
import type StringType from "#StringType";
import test from "@rcompat/test";

const b = optional(boolean);

test.case("empty", assert => {
  assert(b).type<OptionalType<BooleanType>>();

  const e = b.parse(undefined);
  assert<typeof e>(e).equals(undefined).type<boolean | undefined>();
});

test.case("object", assert => {
  type S = ObjectType<{
    bar: ObjectType<{
      baz: BigIntType;
    }>;
    foo: OptionalType<StringType>;
  }>;

  const s = schema({
    bar: {
      baz: bigint,
    },
    foo: optional(string),
  });
  const sv = schema({
    bar: {
      baz: bigint,
    },
    foo: string.optional(),
  });

  assert(s).type<S>();
  assert(sv).type<S>();

  const sv0 = sv.parse({
    bar: {
      baz: 1n,
    },
    foo: undefined,
  });
  assert(sv0).equals({ bar: { baz: 1n } });

  const s0 = s.parse({
    bar: {
      baz: 1n,
    },
    foo: undefined,
  });
  assert(s0).equals({ bar: { baz: 1n } });

  const s1 = s.parse({
    bar: {
      baz: 1n,
    },
  });
  assert(s1).equals({ bar: { baz: 1n } });
});
