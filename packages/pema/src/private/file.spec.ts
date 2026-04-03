import type DefaultType from "#DefaultType";
import file from "#file";
import type FileType from "#FileType";
import test from "#test";

test.case("fail", assert => {
  assert(file).invalid_type(["1", new Blob()]);
});

test.case("pass", assert => {
  assert(file).type<FileType>();

  const f = new File([""], "");
  assert(file.parse(f)).equals(f).type<File>();
});

test.case("default", assert => {
  const f = new File([""], "");
  const f1 = new File([""], "");

  [file.default(f), file.default(() => f)].forEach(d => {
    assert(d).type<DefaultType<FileType, File>>();
    assert(d.parse(undefined)).equals(f).type<File>();
    assert(d.parse(f)).equals(f).type<File>();
    assert(d.parse(f1)).equals(f1).type<File>();
    assert(d).invalid_type(["1", new Blob()]);
  });
});

test.case("toJSON", assert => {
  assert(file.toJSON())
    .type<{ type: "file"; datatype: "blob" }>()
    .equals({ type: "file", datatype: "blob" })
    ;
});
