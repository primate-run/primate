import type ArrayType from "#ArrayType";
import type BooleanType from "#BooleanType";
import type FunctionType from "#FunctionType";
import p from "#index";
import type NumberType from "#NumberType";
import type ObjectType from "#ObjectType";
import type OptionalType from "#OptionalType";
import { Code } from "#schema-errors";
import type StringType from "#StringType";
import test from "#test";
import type TupleType from "#TupleType";
import type { EmptyDict } from "@rcompat/type";

test.case("empty", assert => {
  const o = p.object({});
  assert(o).type<ObjectType<EmptyDict>>();
  assert(o.parse({})).equals({}).type<EmptyDict>();
});

test.case("object", assert => {
  const o = { foo: "bar" };
  type O = { foo: string };
  const o1 = { bar: { baz: 0 }, foo: "bar" };
  type O1 = { bar: { baz: number }; foo: string };

  const s = p.object({ foo: p.string });
  const s1 = p.object({ bar: { baz: p.number }, foo: p.string });

  assert<typeof s>().type<ObjectType<{ foo: StringType }>>();
  assert(s.parse(o)).equals(o).type<O>();

  assert(s1).type<ObjectType<{
    bar: ObjectType<{ baz: NumberType }>; foo: StringType;
  }>>();
  assert(s1.parse(o1)).equals(o1).type<O1>();
});

test.case("loose", assert => {
  const s = p.loose.object({
    name: p.string,
    age: p.number,
    active: p.boolean,
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

  assert(s.parse({
    name: "Bob",
    age: "42",
    active: "true",
  })).equals({
    name: "Bob",
    age: 42,
    active: true,
  }).type<Expected>();
});

test.case("deep loose", assert => {
  const s = p.loose.object({
    user: {
      name: p.string,
      age: p.number,
    },
    scores: p.array(p.number),
    tupled: p.tuple(p.string, p.boolean),
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

  assert(s.parse({
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

test.case("deep loose errors", assert => {
  const s = p.loose.object({
    user: {
      age: p.number,
    },
    scores: p.array(p.number),
    tupled: p.tuple(p.string, p.boolean),
  });

  assert(s).invalid_type([{
    user: { age: "oops" },
    scores: ["1"],
    tupled: ["ok", "true"],
  }], "/user/age");

  assert(s).invalid_type([{
    user: { age: "1" },
    scores: ["oops"],
    tupled: ["ok", "true"],
  }], "/scores/0");

  assert(s).invalid_type([{
    user: { age: "1" },
    scores: ["1"],
    tupled: ["ok", "nope"],
  }], "/tupled/1");
});

test.case("input type with nested defaults", assert => {
  const schema = p.object({
    required: p.string,
    config: {
      host: p.string.default("localhost"),
      port: p.number.default(8080),
    },
    optional: p.string.optional(),
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
  assert(p.object({ foo: p.string.default("bar") })).invalid_type([
    null, 42, "str",
  ]);
});

type Expected = ObjectType<{
  spa: BooleanType;
  ssr: BooleanType;
  name: StringType;
}>;

test.case("extend: adds new fields", assert => {
  const base = p.object({ spa: p.boolean, ssr: p.boolean });
  const extended = base.extend({ name: p.string });

  assert(extended).type<Expected>();
  assert(extended.parse({ spa: true, ssr: false, name: "markdown" }))
    .equals({ spa: true, ssr: false, name: "markdown" })
    .type<{ spa: boolean; ssr: boolean; name: string }>();
});

test.case("extend: preserves options (loose)", assert => {
  const base = p.loose.object({ spa: p.boolean });

  assert(base.extend({ name: p.string }).parse({ spa: "true", name: "html" }))
    .equals({ spa: true, name: "html" });
});

test.case("extend: key collision", assert => {
  const base = p.object({ spa: p.boolean, ssr: p.boolean });

  assert(() => base.extend({ ssr: p.string } as any))
    .throws(Code.extend_key_collision);
  assert<Parameters<typeof base.extend>[0]>().type<never>();
});

test.case("extend: accepts ObjectType", assert => {
  const base = p.object({ spa: p.boolean, ssr: p.boolean });
  const extra = p.object({ name: p.string });
  const extended = base.extend(extra);

  assert(extended).type<Expected>();
  assert(extended.parse({ spa: true, ssr: false, name: "markdown" }))
    .equals({ spa: true, ssr: false, name: "markdown" })
    .type<{ spa: boolean; ssr: boolean; name: string }>();
});

test.case("extend: ObjectType key collision", assert => {
  const base = p.object({ spa: p.boolean, ssr: p.boolean });
  const extra = p.object({ ssr: p.string } as any);

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
  const schema = p.object({
    name: p.string,
    setup: p.function,
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
  const base = p.object({
    name: p.string,
    setup: p.function,
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

  const schema = p.loose.object({
    name: p.string,
    age: p.number,
  }).shape<User>();

  assert(schema).type<ObjectType<{
    name: StringType;
    age: NumberType;
  }, User>>();

  assert(schema.parse({
    name: "Bob",
    age: "42",
  })).equals({
    name: "Bob",
    age: 42,
  }).type<User>();
});

test.case("optional: type and undefined passthrough", assert => {
  const s = p.object({ table: p.string, port: p.number }).optional();

  assert(s)
    .type<OptionalType<ObjectType<{ table: StringType; port: NumberType }>>>();

  const result = s.parse(undefined);
  assert(result).equals(undefined);
});

test.case("optional: parses valid object", assert => {
  const s = p.object({ table: p.string, port: p.number }).optional();

  assert(s.parse({ table: "migrations", port: 5432 }))
    .equals({ table: "migrations", port: 5432 });
});

test.case("optional: still validates when present", assert => {
  const s = p.object({ table: p.string }).optional();

  assert(s).invalid_type([{ table: 42 }], "/table");
});

test.case("optional: nested — outer object becomes optional via all-optional rule", assert => {
  const s = p.object({
    migrations: p.object({ table: p.string }).optional(),
  });

  // omit nested entirely
  assert(s.parse({})).equals({});

  // provide it
  assert(s.parse({ migrations: { table: "m" } }))
    .equals({ migrations: { table: "m" } });

  // explicitly undefined
  assert(s.parse({ migrations: undefined })).equals({});
});
