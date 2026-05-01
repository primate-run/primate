import type BlobType from "#BlobType";
import type DefaultType from "#DefaultType";
import p from "#index";
import test from "#test";

test.case("fail", assert => {
  assert(p.blob).invalid_type(["1"]);
});

test.case("pass", assert => {
  assert(p.blob).type<BlobType>();

  const b = new Blob();
  assert(p.blob.parse(b)).equals(b).type<Blob>();

  // file extends p.blob
  const f = new File([""], "");
  assert(p.blob.parse(f)).equals(f).type<Blob>();
});

test.case("default", assert => {
  const b = new Blob();
  const b1 = new Blob();
  const bd = p.blob.default(b);
  const bd1 = p.blob.default(() => b);

  [bd, bd1].forEach(d => {
    assert(d).type<DefaultType<BlobType, Blob>>();
    assert(d.parse(undefined)).equals(b).type<Blob>();
    assert(d.parse(b)).equals(b).type<Blob>();
    assert(d.parse(b1)).equals(b1).type<Blob>();
    assert(d).invalid_type([1]);
  });

  const f = new File([""], "");
  const fd = p.blob.default(f);
  assert(fd).type<DefaultType<BlobType, File>>();
});

test.case("toJSON", assert => {
  assert(p.blob.toJSON())
    .type<{ type: "blob"; datatype: "blob" }>()
    .equals({ type: "blob", datatype: "blob" })
    ;
});
