import type DefaultType from "#DefaultType";
import expect from "#expect";
import string from "#string";
import type StringType from "#StringType";
import messagesOf from "#test/messages-of";
import pathsOf from "#test/paths-of";
import throwsIssues from "#test/throws-issues";
import dim from "@rcompat/cli/color/dim";
import test from "@rcompat/test";

test.case("fail", assert => {
  const issues = throwsIssues(assert, () => string.parse(1));
  assert(pathsOf(issues)).equals([""]);
  assert(messagesOf(issues)).equals([expect("s", 1)]);
});

test.case("pass", assert => {
  assert(string).type<StringType>();
  assert(string.parse("test")).equals("test").type<string>();
});

test.case("default", assert => {
  [string.default("foo"), string.default(() => "foo")].forEach(d => {
    assert(d).type<DefaultType<StringType, "foo">>();
    assert(d.parse(undefined)).equals("foo").type<string>();
    assert(d.parse("foo")).equals("foo").type<string>();
    assert(d.parse("bar")).equals("bar").type<string>();
    assert(() => d.parse(1)).throws(expect("s", 1));
  });
});

test.case("validator - startsWith", assert => {
  const sw = string.startsWith("/");

  assert(sw).type<StringType>();
  assert(sw.parse("/")).equals("/").type<string>();
  assert(sw.parse("/foo")).equals("/foo").type<string>();
  assert(() => sw.parse("foo")).throws("\"foo\" does not start with \"/\"");
});

test.case("validator - endsWith", assert => {
  const ew = string.endsWith("/");

  assert(ew).type<StringType>();
  assert(ew.parse("/")).equals("/").type<string>();
  assert(ew.parse("foo/")).equals("foo/").type<string>();
  assert(() => ew.parse("foo")).throws("\"foo\" does not end with \"/\"");
});

test.case("validator - email", assert => {
  const email = string.email();
  assert(email).type<StringType>();

  [
    "4d0996 b-BDA9-4f95-ad7c-7075b10d4ba6",
    "a@b",
    "c.com",
  ].forEach(fail => {
    assert(() => email.parse(fail)).throws(`"${fail}" is not a valid email`);
  });

  const pass = "John.Doe@example.com";
  [pass, pass.toLowerCase(), pass.toUpperCase()].forEach(passing => {
    assert(email.parse(passing)).equals(passing);
  });

});

test.case("validator - uuid", assert => {
  const uuid = string.uuid();
  assert(uuid).type<StringType>();

  [
    "4d0996 b-BDA9-4f95-ad7c-7075b10d4ba6",
    "4d0996db-BD$9-4f95-ad7c-7075b10d4ba6",
    "4d0996db-BDA9-%f95-ad7c-7075b10d4ba6",
  ].forEach(fail => {
    assert(() => uuid.parse(fail)).throws(`"${fail}" is not a valid UUID`);
  });

  const pass = "4d0996db-BDA9-4f95-ad7c-7075b10d4ba6";
  [pass, pass.toLowerCase(), pass.toUpperCase()].forEach(passing => {
    assert(uuid.parse(passing)).equals(passing);
  });
});

test.case("validator - min", assert => {
  assert(() => string.min(-10))
    .throws(`min: ${dim("-10")} must be positive`);
  const min = string.min(5);
  assert(min.parse("hello")).equals("hello").type<string>();
  assert(min.parse("universe")).equals("universe").type<string>();
  assert(() => min.parse("hi")).throws("min 5 characters");
});

test.case("validator - max", assert => {
  assert(() => string.max(-10))
    .throws(`max: ${dim("-10")} must be positive`);
  const max = string.max(5);
  assert(max.parse("hello")).equals("hello").type<string>();
  assert(max.parse("hi")).equals("hi").type<string>();
  assert(() => max.parse("universe")).throws("max 5 characters");
});

test.case("validator - length", assert => {
  assert(() => string.length(-10, 10))
    .throws(`length: ${dim("-10")} and ${dim("10")} must be positive`);
  assert(() => string.length(10, -10))
    .throws(`length: ${dim("10")} and ${dim("-10")} must be positive`);
  assert(() => string.length(5, 3))
    .throws(`length: ${dim("5")} must be lower than ${dim("3")}`);
  const length = string.length(0, 5);
  assert(length.parse("hello")).equals("hello").type<string>();
  assert(length.parse("hi")).equals("hi").type<string>();
  assert(length.parse("")).equals("").type<string>();
  assert(() => length.parse("universe")).throws("length out of range");
});

test.case("combined validators", assert => {
  const sew = string.startsWith("/").endsWith(".");

  assert(sew).type<StringType>();
  assert(sew.parse("/.")).equals("/.").type<string>();
  assert(sew.parse("/foo.")).equals("/foo.").type<string>();

  {
    const issues = throwsIssues(assert, () => sew.parse("foo"));
    assert(pathsOf(issues)).equals([""]); // top-level string
    assert(messagesOf(issues)).equals(["\"foo\" does not start with \"/\""]);
  }
  {
    const issues = throwsIssues(assert, () => sew.parse("foo."));
    assert(pathsOf(issues)).equals([""]);
    assert(messagesOf(issues)).equals(["\"foo.\" does not start with \"/\""]);
  }
  {
    const issues = throwsIssues(assert, () => sew.parse("/foo"));
    assert(pathsOf(issues)).equals([""]);
    assert(messagesOf(issues)).equals(["\"/foo\" does not end with \".\""]);
  }
});

test.case("toJSON", assert => {
  assert(string.toJSON())
    .type<{ type: "string"; datatype: "string" }>()
    .equals({ type: "string", datatype: "string" })
    ;
});
