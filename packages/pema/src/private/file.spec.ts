import type DefaultType from "#DefaultType";
import expect from "#expect";
import file from "#file";
import type FileType from "#FileType";
import test from "@rcompat/test";

test.case("fail", assert => {
  assert(() => file.parse("1")).throws(expect("f", "1"));

  const b = new Blob();
  assert(() => file.parse(b)).throws(expect("f", b));
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
    assert(() => d.parse(1)).throws(expect("f", 1));
  });
});
