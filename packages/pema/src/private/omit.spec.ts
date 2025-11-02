import number from "#number";
import type NumberType from "#NumberType";
import object from "#object";
import omit from "#omit";
import type OmitType from "#OmitType";
import string from "#string";
import type StringType from "#StringType";
import test from "@rcompat/test";

test.case("omit single field", assert => {
  const original = object({
    id: string,
    name: string,
    age: number,
  });

  const omitted = omit(original, "id");

  assert(omitted).type<OmitType<{
    id: StringType;
    name: StringType;
    age: NumberType;
  }, "id">>();

  const parsed = omitted.parse({ name: "Alice", age: 30 });
  assert(parsed).equals({ name: "Alice", age: 30 });
  assert(parsed).type<{ name: string; age: number }>();
});

test.case("omit from nested object", assert => {
  const original = object({
    id: string,
    user: {
      name: string,
      email: string,
    },
    count: number,
  });

  const omitted = omit(original, "id");

  const parsed = omitted.parse({
    user: { name: "Bob", email: "bob@example.com" },
    count: 5,
  });

  assert(parsed).equals({
    user: { name: "Bob", email: "bob@example.com" },
    count: 5,
  });

  assert(parsed).type<{
    user: { name: string; email: string };
    count: number;
  }>();
});

test.case("omit with optional fields", assert => {
  const original = object({
    id: string,
    name: string,
    nickname: string.optional(),
  });

  const omitted = omit(original, "id");

  const parsed1 = omitted.parse({ name: "Charlie" });
  assert(parsed1).equals({ name: "Charlie" });

  const parsed2 = omitted.parse({ name: "Charlie", nickname: "Chuck" });
  assert(parsed2).equals({ name: "Charlie", nickname: "Chuck" });

  assert(parsed2).type<{ name: string; nickname: string | undefined }>();
});

test.case("omit with default values", assert => {
  const original = object({
    id: string,
    name: string,
    count: number.default(0),
  });

  const omitted = omit(original, "id");

  const parsed = omitted.parse({ name: "Dave" });
  assert(parsed).equals({ name: "Dave", count: 0 });
});

test.case("omit different field types", assert => {
  const original = object({
    id: number,
    username: string,
    active: string, // Could be boolean in real usage
    score: number,
  });

  const withoutId = omit(original, "id");
  const withoutUsername = omit(original, "username");

  assert(withoutId.parse({ username: "user", active: "true", score: 100 }))
    .equals({ username: "user", active: "true", score: 100 });

  assert(withoutUsername.parse({ id: 1, active: "false", score: 50 }))
    .equals({ id: 1, active: "false", score: 50 });
});

test.case("omit fails on invalid data", assert => {
  const original = object({
    id: string,
    age: number,
  });

  const omitted = omit(original, "id");

  assert(() => omitted.parse({ age: "not a number" })).throws();
});

test.case("omit preserves validation", assert => {
  const original = object({
    id: string,
    email: string,
    age: number.min(0).max(120),
  });

  const omitted = omit(original, "id");

  // valid
  const valid = omitted.parse({ email: "test@example.com", age: 25 });
  assert(valid).equals({ email: "test@example.com", age: 25 });

  // invalid - age out of range
  assert(() => omitted.parse({ email: "test@example.com", age: 150 })).throws();
});

test.case("omit multiple fields", assert => {
  const original = object({
    id: string,
    session_id: string,
    name: string,
    age: number,
  });

  const omitted = omit(original, "id", "session_id");

  const parsed = omitted.parse({ name: "Alice", age: 30 });
  assert(parsed).equals({ name: "Alice", age: 30 });
  assert(parsed).type<{ name: string; age: number }>();
});

test.case("omit all but one field", assert => {
  const original = object({
    id: number,
    username: string,
    email: string,
    active: string,
  });

  const omitted = omit(original, "id", "email", "active");

  const parsed = omitted.parse({ username: "bob" });
  assert(parsed).equals({ username: "bob" });
  assert(parsed).type<{ username: string }>();
});
