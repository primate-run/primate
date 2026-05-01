import type DefaultType from "#DefaultType";
import type FileType from "#FileType";
import p from "#index";
import test from "#test";

test.case("fail", assert => {
  assert(p.file).invalid_type(["1", new Blob()]);
});

test.case("pass", assert => {
  assert(p.file).type<FileType>();

  const f = new File([""], "");
  assert(p.file.parse(f)).equals(f).type<File>();
});

test.case("default", assert => {
  const f = new File([""], "");
  const f1 = new File([""], "");

  [p.file.default(f), p.file.default(() => f)].forEach(d => {
    assert(d).type<DefaultType<FileType, File>>();
    assert(d.parse(undefined)).equals(f).type<File>();
    assert(d.parse(f)).equals(f).type<File>();
    assert(d.parse(f1)).equals(f1).type<File>();
    assert(d).invalid_type(["1", new Blob()]);
  });
});

test.case("toJSON", assert => {
  assert(p.file.toJSON())
    .type<{ type: "file"; datatype: "blob" }>()
    .equals({ type: "file", datatype: "blob" })
    ;
});
