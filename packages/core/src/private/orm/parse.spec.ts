import ForeignKey from "#orm/ForeignKey";
import key from "#orm/key";
import parse from "#orm/parse";
import PrimaryKey from "#orm/PrimaryKey";
import color from "@rcompat/cli/color";
import test from "@rcompat/test";
import p from "pema";

const { dim } = color;

test.case("extracts primary key", assert => {
  const result = parse({
    id: key.primary(p.string),
    name: p.string,
  });
  assert(result.pk).equals("id");
});

test.case("extracts foreign keys", assert => {
  const result = parse({
    id: key.primary(p.string),
    author_id: key.foreign(p.string),
  });
  assert(result.fks.size).equals(1);
  assert(result.fks.has("author_id")).true();
});

test.case("schema contains unwrapped types", assert => {
  const result = parse({
    id: key.primary(p.string),
    author_id: key.foreign(p.u32),
    title: p.string,
  });
  // should be pema types, not PrimaryKey/ForeignKey wrappers
  assert(result.schema["id"]).equals(p.string);
  assert(result.schema["author_id"]).equals(p.u32);
  assert(result.schema["title"]).equals(p.string);
  assert(result.schema["id"] instanceof PrimaryKey).false();
  assert(result.schema["author_id"] instanceof ForeignKey).false();
});

test.case("throws on multiple primary keys", assert => {
  assert(() => parse({
    id: key.primary(p.string),
    id2: key.primary(p.u32),
  })).throws(`multiple primary keys: ${dim("id")}, ${dim("id2")}`);
});
