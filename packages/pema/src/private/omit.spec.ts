import p from "#index";
import type NumberType from "#NumberType";
import type OmitType from "#OmitType";
import type StringType from "#StringType";
import test from "#test";

test.case("single field", assert => {
  const original = p.object({
    id: p.string,
    name: p.string,
    age: p.number,
  });

  const omitted = p.omit(original, "id");

  assert(omitted).type<OmitType<{
    id: StringType;
    name: StringType;
    age: NumberType;
  }, "id">>();

  const parsed = omitted.parse({ name: "John", age: 30 });
  assert(parsed).equals({ name: "John", age: 30 });
  assert(parsed).type<{ name: string; age: number }>();
});

test.case("from nested p.object", assert => {
  const original = p.object({
    id: p.string,
    user: {
      name: p.string,
      email: p.string,
    },
    count: p.number,
  });

  const omitted = p.omit(original, "id");

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

test.case("with optional fields", assert => {
  const original = p.object({
    id: p.string,
    name: p.string,
    nickname: p.string.optional(),
  });

  const omitted = p.omit(original, "id");

  const parsed1 = omitted.parse({ name: "Charlie" });
  assert(parsed1).equals({ name: "Charlie" });

  const parsed2 = omitted.parse({ name: "Charlie", nickname: "Chuck" });
  assert(parsed2).equals({ name: "Charlie", nickname: "Chuck" });

  assert(parsed2).type<{ name: string; nickname: string | undefined }>();
});

test.case("with default values", assert => {
  const original = p.object({
    id: p.string,
    name: p.string,
    count: p.number.default(0),
  });

  const omitted = p.omit(original, "id");

  const parsed = omitted.parse({ name: "Dave" });
  assert(parsed).equals({ name: "Dave", count: 0 });
});

test.case("different field types", assert => {
  const original = p.object({
    id: p.number,
    username: p.string,
    active: p.string, // Could be boolean in real usage
    score: p.number,
  });

  const withoutId = p.omit(original, "id");
  const withoutUsername = p.omit(original, "username");

  assert(withoutId.parse({ username: "user", active: "true", score: 100 }))
    .equals({ username: "user", active: "true", score: 100 });

  assert(withoutUsername.parse({ id: 1, active: "false", score: 50 }))
    .equals({ id: 1, active: "false", score: 50 });
});

test.case("fails on invalid data", assert => {
  const original = p.object({
    id: p.string,
    age: p.number,
  });

  const omitted = p.omit(original, "id");

  assert(omitted).invalid_type([{ age: "not a p.number " }], "/age");
});

test.case("preserves validation", assert => {
  const original = p.object({
    id: p.string,
    email: p.string,
    age: p.number.min(0).max(120),
  });

  const omitted = p.omit(original, "id");

  // valid
  const valid = omitted.parse({ email: "hi@example.com", age: 25 });
  assert(valid).equals({ email: "hi@example.com", age: 25 });

  // invalid - age beyond range
  assert(omitted).too_large([{ email: "hi@example.com", age: 150 }], "/age");
});

test.case("supports multiple fields", assert => {
  const original = p.object({
    id: p.string,
    session_id: p.string,
    name: p.string,
    age: p.number,
  });

  const omitted = p.omit(original, "id", "session_id");

  const parsed = omitted.parse({ name: "John", age: 30 });
  assert(parsed).equals({ name: "John", age: 30 });
  assert(parsed).type<{ name: string; age: number }>();
});

test.case("all but one field", assert => {
  const original = p.object({
    id: p.number,
    username: p.string,
    email: p.string,
    active: p.string,
  });

  const omitted = p.omit(original, "id", "email", "active");

  const parsed = omitted.parse({ username: "bob" });
  assert(parsed).equals({ username: "bob" });
  assert(parsed).type<{ username: string }>();
});
