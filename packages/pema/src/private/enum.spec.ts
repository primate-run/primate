import array from "#array";
import type DefaultType from "#DefaultType";
import p_enum from "#enum";
import type EnumType from "#EnumType";
import type OptionalType from "#OptionalType";
import test from "#test";

const templates = ["handlebars", "mustache", "nunjucks", "xslt"] as const;
type Template = typeof templates[number];
const e = p_enum(templates);

test.case("pass", assert => {
  assert(e).type<EnumType<typeof templates>>();
  assert(e.parse("handlebars")).equals("handlebars").type<Template>();
  assert(e.parse("mustache")).equals("mustache").type<Template>();
  assert(e.parse("nunjucks")).equals("nunjucks").type<Template>();
  assert(e.parse("xslt")).equals("xslt").type<Template>();
});

test.case("fail", assert => {
  assert(e).invalid_type(["foo", 42, null, undefined, true, {}]);
});

test.case("optional", assert => {
  const o = e.optional();
  assert(o).type<OptionalType<EnumType<typeof templates>>>();
  assert(o.parse(undefined)).equals(undefined);
  assert(o.parse("handlebars")).equals("handlebars");
  assert(o).invalid_type(["foo", 42]);
});

test.case("default", assert => {
  [e.default("handlebars"), e.default(() => "handlebars")].forEach(d => {
    assert(d).type<DefaultType<EnumType<typeof templates>, "handlebars">>();
    assert(d.parse(undefined)).equals("handlebars").type<Template>();
    assert(d.parse("mustache")).equals("mustache").type<Template>();
    assert(d).invalid_type(["foo", 42]);
  });
});

test.case("toJSON", assert => {
  assert(e.toJSON()).equals({
    type: "enum",
    values: ["handlebars", "mustache", "nunjucks", "xslt"],
  });
});

test.case("array unique", assert => {
  const a = array(e).unique();
  const input = ["handlebars", "mustache"];
  assert(a.parse(input)).equals(input);
  assert(a).duplicate([["handlebars", "handlebars"]], "/1");
});
