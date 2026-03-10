import array from "#array";
import type DefaultType from "#DefaultType";
import p_enum from "#enum";
import type EnumType from "#EnumType";
import type OptionalType from "#OptionalType";
import messagesOf from "#test/messages-of";
import pathsOf from "#test/paths-of";
import throwsIssues from "#test/throws-issues";
import test from "@rcompat/test";

const templates = ["handlebars", "mustache", "nunjucks", "xslt"] as const;
type Template = typeof templates[number];
const e = p_enum(templates);

const E = templates.map(t => `"${t}"`).join(" | ");

test.case("pass", assert => {
  assert(e).type<EnumType<typeof templates>>();
  assert(e.parse("handlebars")).equals("handlebars").type<Template>();
  assert(e.parse("mustache")).equals("mustache").type<Template>();
  assert(e.parse("nunjucks")).equals("nunjucks").type<Template>();
  assert(e.parse("xslt")).equals("xslt").type<Template>();
});

test.case("fail", assert => {
  const issues = throwsIssues(assert, () => e.parse("foo"));
  assert(pathsOf(issues)).equals([""]);
  assert(messagesOf(issues)).equals([`expected ${E}, got \`foo\` (string)`]);
});

test.case("fail: non-string", assert => {
  const issues = throwsIssues(assert, () => e.parse(42));
  assert(pathsOf(issues)).equals([""]);
  assert(messagesOf(issues)).equals([`expected ${E}, got \`42\` (number)`]);
});

test.case("optional", assert => {
  const o = e.optional();
  assert(o).type<OptionalType<EnumType<typeof templates>>>();
  assert(o.parse(undefined)).equals(undefined);
  assert(o.parse("handlebars")).equals("handlebars");
});

test.case("default", assert => {
  const d = e.default("handlebars");
  assert(d).type<DefaultType<EnumType<typeof templates>, "handlebars">>();

  assert(d.parse(undefined)).equals("handlebars").type<Template>();
  assert(d.parse("mustache")).equals("mustache").type<Template>();
});

test.case("toJSON", assert => {
  assert(e.toJSON()).equals({
    type: "enum",
    values: ["handlebars", "mustache", "nunjucks", "xslt"],
  });
});

test.case("array unique", assert => {
  const a = array(e).unique();
  assert(a.parse(["handlebars", "mustache"])).equals(
    ["handlebars", "mustache"]);
  const issues = throwsIssues(assert, () =>
    a.parse(["handlebars", "handlebars"]));
  assert(pathsOf(issues)).equals(["/1"]);
  assert(messagesOf(issues))
    .equals(["duplicate value at index 1 (first seen at 0)"]);
});
