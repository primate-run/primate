import { Code } from "#db/errors";
import ForeignKey from "#store/ForeignKey";
import key from "#store/key";
import parse from "#store/parse";
import PrimaryKey from "#store/PrimaryKey";
import test from "@rcompat/test";
import p from "pema";

test.case("extracts primary key", assert => {
  const result = parse({
    id: key.primary(p.uuid),
    name: p.string,
  });
  assert(result.pk).equals("id");
});

test.case("extracts foreign keys", assert => {
  const result = parse({
    id: key.primary(p.uuid),
    author_id: key.foreign(p.uuid),
  });
  assert(result.fks.size).equals(1);
  assert(result.fks.has("author_id")).true();
});

test.case("schema contains unwrapped types", assert => {
  const result = parse({
    id: key.primary(p.uuid),
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
    id: key.primary(p.uuid),
    id2: key.primary(p.u32),
  })).throws(Code.pk_multiple_pks);
});
