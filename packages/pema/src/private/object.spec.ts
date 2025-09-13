import number from "#number";
import type NumberType from "#NumberType";
import object from "#object";
import type ObjectType from "#ObjectType";
import string from "#string";
import type StringType from "#StringType";
import test from "@rcompat/test";
import type EO from "@rcompat/type/EO";

test.case("empty", assert => {
  const o = object({});
  assert(o).type<ObjectType<EO>>();
  assert(o.parse({})).equals({}).type<EO>();
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

  // Type tests
  const input1: typeof schema.input = {
    required: "test",
  };
  const input2: typeof schema.input = {
    required: "test",
    config: {},
  };
  assert(schema.input).type<ExpectedInput>();

  // Runtime tests - these are probably failing
  const result1 = schema.parse({ required: "test" });
  assert(result1).equals({
    required: "test",
    config: { host: "localhost", port: 8080 }, // Should apply defaults
  });

  const result2 = schema.parse({ required: "test", config: {} });
  assert(result2).equals({
    required: "test",
    config: { host: "localhost", port: 8080 }, // Should apply defaults
  });

  const result3 = schema.parse({ required: "test", config: { host: "custom" } });
  assert(result3).equals({
    required: "test",
    config: { host: "custom", port: 8080 }, // Should apply port default
  });
});
