import blob from "#blob";
import type BlobType from "#BlobType";
import type DefaultType from "#DefaultType";
import expect from "#expect";
import test from "@rcompat/test";

test.case("fail", assert => {
  assert(() => blob.parse("1")).throws(expect("bb", "1"));
});

test.case("pass", assert => {
  assert(blob).type<BlobType>();

  const b = new Blob();
  assert(blob.parse(b)).equals(b).type<Blob>();

  // file extends blob
  const f = new File([""], "");
  assert(blob.parse(f)).equals(f).type<Blob>();
});

test.case("default", assert => {
  const b = new Blob();
  const b1 = new Blob();
  const bd = blob.default(b);
  const bd1 = blob.default(() => b);

  [bd, bd1].forEach(d => {
    assert(d).type<DefaultType<BlobType, Blob>>();
    assert(d.parse(undefined)).equals(b).type<Blob>();
    assert(d.parse(b)).equals(b).type<Blob>();
    assert(d.parse(b1)).equals(b1).type<Blob>();
    assert(() => d.parse(1)).throws("expected blob, got `1` (number)");
  });

  const f = new File([""], "");
  const fd = blob.default(f);
  assert(fd).type<DefaultType<BlobType, File>>();
});
