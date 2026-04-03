import array from "#array";
import type ArrayType from "#ArrayType";
import boolean from "#boolean";
import type BooleanType from "#BooleanType";
import fn from "#function";
import type FunctionType from "#FunctionType";
import number from "#number";
import type NumberType from "#NumberType";
import object from "#object";
import type ObjectType from "#ObjectType";
import type OptionalType from "#OptionalType";
import { Code } from "#schema-errors";
import string from "#string";
import type StringType from "#StringType";
import test from "#test";
import tuple from "#tuple";
import type TupleType from "#TupleType";
import type { EmptyObject } from "@rcompat/type";

test.case("empty", assert => {
  const o = object({});
  assert(o).type<ObjectType<EmptyObject>>();
  assert(o.parse({})).equals({}).type<EmptyObject>();
});

test.case("object", assert => {
  const o = { foo: "bar" };
  type O = { foo: string };
  const o1 = { bar: { baz: 0 }, foo: "bar" };
  type O1 = { bar: { baz: number }; foo: string };

  const s = object({ foo: string });
  const s1 = object({ bar: { baz: number }, foo: string });

  assert<typeof s>().type<ObjectType<{ foo: StringType }>>();
  assert(s.parse(o)).equals(o).type<O>();

  assert(s1).type<ObjectType<{
    bar: ObjectType<{ baz: NumberType }>; foo: StringType;
  }>>();
  assert(s1.parse(o1)).equals(o1).type<O1>();
});

test.case("coerce", assert => {
  const s = object({
    name: string,
    age: number,
    active: boolean,
  });

  type Expected = {
    name: string;
    age: number;
    active: boolean;
  };

  assert(s).type<ObjectType<{
    name: StringType;
    age: NumberType;
    active: BooleanType;
  }>>();

  assert(s.coerce({
    name: "Bob",
    age: "42",
    active: "true",
  })).equals({
    name: "Bob",
    age: 42,
    active: true,
  }).type<Expected>();
});

test.case("deep coerce", assert => {
  const s = object({
    user: {
      name: string,
      age: number,
    },
    scores: array(number),
    tupled: tuple(string, boolean),
  });

  type Expected = {
    user: {
      name: string;
      age: number;
    };
    scores: number[];
    tupled: [string, boolean];
  };

  assert(s).type<ObjectType<{
    user: ObjectType<{
      name: StringType;
      age: NumberType;
    }>;
    scores: ArrayType<NumberType>;
    tupled: TupleType<[StringType, BooleanType]>;
  }>>();

  assert(s.coerce({
    user: {
      name: "Bob",
      age: "42",
    },
    scores: ["1", "2"],
    tupled: ["yes", "true"],
  })).equals({
    user: {
      name: "Bob",
      age: 42,
    },
    scores: [1, 2],
    tupled: ["yes", true],
  }).type<Expected>();
});

test.case("deep coerce errors", assert => {
  const s = object({
    user: {
      age: number,
    },
    scores: array(number),
    tupled: tuple(string, boolean),
  });

  assert(s).coerce_invalid_type([{
    user: { age: "oops" },
    scores: ["1"],
    tupled: ["ok", "true"],
  }], "/user/age");

  assert(s).coerce_invalid_type([{
    user: { age: "1" },
    scores: ["oops"],
    tupled: ["ok", "true"],
  }], "/scores/0");

  assert(s).coerce_invalid_type([{
    user: { age: "1" },
    scores: ["1"],
    tupled: ["ok", "nope"],
  }], "/tupled/1");
});

test.case("input type with nested defaults", assert => {
  const schema = object({
    required: string,
    config: {
      host: string.default("localhost"),
      port: number.default(8080),
    },
    optional: string.optional(),
  });

  type ExpectedInput = {
    required: string;
    config?: {
      host?: string;
      port?: number;
    };
    optional?: string;
  };

  assert(schema.input).type<ExpectedInput>();

  // runtime tests, these are probably failing
  const result1 = schema.parse({ required: "test" });
  assert(result1).equals({
    required: "test",
    config: { host: "localhost", port: 8080 }, // should apply defaults
  });

  const result2 = schema.parse({ required: "test", config: {} });
  assert(result2).equals({
    required: "test",
    config: { host: "localhost", port: 8080 }, // should apply defaults
  });

  const result3 = schema.parse({
    required: "test", config: { host: "custom" },
  });
  assert(result3).equals({
    required: "test",
    config: { host: "custom", port: 8080 }, // should apply port default
  });
});

test.case("non-object input throws", assert => {
  assert(object({ foo: string.default("bar") })).invalid_type([
    null, 42, "str",
  ]);
});

type Expected = ObjectType<{
  spa: BooleanType;
  ssr: BooleanType;
  name: StringType;
}>;

test.case("extend: adds new fields", assert => {
  const base = object({ spa: boolean, ssr: boolean });
  const extended = base.extend({ name: string });

  assert(extended).type<Expected>();
  assert(extended.parse({ spa: true, ssr: false, name: "markdown" }))
    .equals({ spa: true, ssr: false, name: "markdown" })
    .type<{ spa: boolean; ssr: boolean; name: string }>();
});

test.case("extend: preserves options (coerce)", assert => {
  const base = object({ spa: boolean });

  assert(base.extend({ name: string }).coerce({ spa: "true", name: "html" }))
    .equals({ spa: true, name: "html" });
});

test.case("extend: key collision", assert => {
  const base = object({ spa: boolean, ssr: boolean });

  assert(() => base.extend({ ssr: string } as any))
    .throws(Code.extend_key_collision);
  assert<Parameters<typeof base.extend>[0]>().type<never>();
});

test.case("extend: accepts ObjectType", assert => {
  const base = object({ spa: boolean, ssr: boolean });
  const extra = object({ name: string });
  const extended = base.extend(extra);

  assert(extended).type<Expected>();
  assert(extended.parse({ spa: true, ssr: false, name: "markdown" }))
    .equals({ spa: true, ssr: false, name: "markdown" })
    .type<{ spa: boolean; ssr: boolean; name: string }>();
});

test.case("extend: ObjectType key collision", assert => {
  const base = object({ spa: boolean, ssr: boolean });
  const extra = object({ ssr: string } as any);

  assert(() => base.extend(extra)).throws(Code.extend_key_collision);
});

type Setup = {
  onInit(hook: () => void): void;
};

interface Module {
  name: string;
  setup(setup: Setup): void;
}

test.case("shape: aliases inferred output", assert => {
  const schema = object({
    name: string,
    setup: fn,
  }).shape<Module>();

  assert(schema).type<ObjectType<{
    name: StringType;
    setup: FunctionType;
  }, Module>>();

  const mod: Module = {
    name: "markdown",
    setup(_setup) { },
  };

  assert(schema.parse(mod))
    .equals(mod)
    .type<Module>();
});

test.case("shape: preserves runtime behavior", assert => {
  const base = object({
    name: string,
    setup: fn,
  });

  const shaped = base.shape<Module>();

  const mod = {
    name: "markdown",
    setup(_setup: Setup) { },
  };

  assert(shaped.parse(mod)).equals(base.parse(mod));
  assert(shaped.toJSON()).equals(base.toJSON());
});

test.case("shape: preserves parsing/coercion", assert => {
  type User = {
    name: string;
    age: number;
  };

  const schema = object({
    name: string,
    age: number,
  }).shape<User>();

  assert(schema).type<ObjectType<{
    name: StringType;
    age: NumberType;
  }, User>>();

  assert(schema.coerce({
    name: "Bob",
    age: "42",
  })).equals({
    name: "Bob",
    age: 42,
  }).type<User>();
});

test.case("optional: type and undefined passthrough", assert => {
  const s = object({ table: string, port: number }).optional();

  assert(s)
    .type<OptionalType<ObjectType<{ table: StringType; port: NumberType }>>>();

  const result = s.parse(undefined);
  assert(result).equals(undefined);
});

test.case("optional: parses valid object", assert => {
  const s = object({ table: string, port: number }).optional();

  assert(s.parse({ table: "migrations", port: 5432 }))
    .equals({ table: "migrations", port: 5432 });
});

test.case("optional: still validates when present", assert => {
  const s = object({ table: string }).optional();

  assert(s).invalid_type([{ table: 42 }], "/table");
});

test.case("optional: nested — outer object becomes optional via all-optional rule", assert => {
  const s = object({
    migrations: object({ table: string }).optional(),
  });

  // omit nested entirely
  assert(s.parse({})).equals({});

  // provide it
  assert(s.parse({ migrations: { table: "m" } }))
    .equals({ migrations: { table: "m" } });

  // explicitly undefined
  assert(s.parse({ migrations: undefined })).equals({});
});
