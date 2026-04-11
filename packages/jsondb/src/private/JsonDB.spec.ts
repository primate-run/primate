import JSONDB from "#JSONDB";
import core_test from "@primate/core/db/test";
import fs from "@rcompat/fs";
import test from "@rcompat/test";
import p from "pema";

// Core test suite
core_test(new JSONDB());

// Custom tests for JSON-specific behavior

const tmp_path = `/tmp/primate-jsondb-test-${Date.now()}`;
const db = new JSONDB({ directory: tmp_path });

const dt = {
  u8: p.u8.datatype,
  u32: p.u32.datatype,
  u64: p.u64.datatype,
  i64: p.i64.datatype,
  string: p.string.datatype,
  blob: p.blob.datatype,
};

const users_types = { id: dt.u32, name: dt.string, age: dt.u8 } as const;
const users_as = { table: "json_test", pk: "id", types: users_types };

test.ended(async () => {
  db.close();
  const dir = fs.ref(tmp_path);
  if (await dir.exists()) {
    await dir.remove({ recursive: true });
  }
});

async function $(body: () => Promise<void>) {
  await db.schema.create("json_test", { name: "id", generate: true },
    users_types);
  await body();
  await db.schema.delete("json_test");
}

test.case("persists data to JSON file", async assert => {
  await $(async () => {
    await db.create(users_as, { id: 1, name: "Alice", age: 30 });

    const ref = fs.ref(tmp_path).join("json_test.json");
    assert(await ref.exists()).true();

    const text = await ref.text();
    const data = JSON.parse(text);
    assert(data.length).equals(1);
    assert(data[0].name).equals("Alice");
  });
});

test.case("serializes BigInt as {__type:'bigint', value:string}", async assert => {
  const bigint_types = { id: dt.u32, amount: dt.i64 } as const;
  const bigint_as = { table: "bigint_test", pk: "id", types: bigint_types };

  await db.schema.create("bigint_test", { name: "id", generate: true },
    bigint_types);

  await db.create(bigint_as, { id: 1, amount: 9007199254740993n });

  const ref = fs.ref(tmp_path).join("bigint_test.json");
  const text = await ref.text();
  const data = JSON.parse(text);

  assert(data[0].amount.__type).equals("bigint");
  assert(data[0].amount.value).equals("9007199254740993");

  await db.schema.delete("bigint_test");
});

test.case("serializes Blob as {__type:'blob', value:base64}", async assert => {
  const blob_types = { id: dt.u32, data: dt.blob } as const;
  const blob_as = { table: "blob_test", pk: "id", types: blob_types };

  await db.schema.create("blob_test", { name: "id", generate: true },
    blob_types);

  const blob = new Blob([new Uint8Array([72, 101, 108, 108, 111])], {
    type: "application/octet-stream",
  });
  await db.create(blob_as, { id: 1, data: blob });

  const ref = fs.ref(tmp_path).join("blob_test.json");
  const text = await ref.text();
  const data = JSON.parse(text);

  assert(data[0].data.__type).equals("blob");
  // "Hello" in base64 is "SGVsbG8="
  assert(data[0].data.value).equals("SGVsbG8=");

  await db.schema.delete("blob_test");
});

test.case("survives reload from disk", async assert => {
  const reload_types = { id: dt.u32, name: dt.string } as const;
  const reload_as = { table: "reload_test", pk: "id", types: reload_types };

  await db.schema.create("reload_test", { name: "id", generate: true },
    reload_types);
  await db.create(reload_as, { id: 1, name: "persisted" });

  // create a new instance pointing to the same directory
  const db2 = new JSONDB({ directory: tmp_path });
  await db2.schema.create("reload_test", { name: "id", generate: true },
    reload_types);

  const rows = await db2.read(reload_as, { where: {} });
  assert(rows.length).equals(1);
  assert(rows[0].name).equals("persisted");

  await db.schema.delete("reload_test");
});

test.case("deserializes BigInt from JSON on reload", async assert => {
  const bi_types = { id: dt.u32, value: dt.u64 } as const;
  const bi_as = { table: "bigint_reload", pk: "id", types: bi_types };

  await db.schema.create("bigint_reload", { name: "id", generate: true },
    bi_types);
  await db.create(bi_as, { id: 1, value: 12345678901234n });

  const db2 = new JSONDB({ directory: tmp_path });
  await db2.schema.create("bigint_reload", { name: "id", generate: true },
    bi_types);

  const rows = await db2.read(bi_as, { where: {} });
  assert(rows[0].value).equals(12345678901234n);

  await db.schema.delete("bigint_reload");
});

test.case("deserializes Blob from JSON on reload", async assert => {
  const bl_types = { id: dt.u32, data: dt.blob } as const;
  const bl_as = { table: "blob_reload", pk: "id", types: bl_types };

  await db.schema.create("blob_reload", { name: "id", generate: true },
    bl_types);

  const original = new Blob([new Uint8Array([1, 2, 3, 4, 5])], {
    type: "application/octet-stream",
  });
  await db.create(bl_as, { id: 1, data: original });

  const db2 = new JSONDB({ directory: tmp_path });
  await db2.schema.create("blob_reload", { name: "id", generate: true },
    bl_types);

  const rows = await db2.read(bl_as, { where: {} });
  const restored = rows[0].data as Blob;
  const bytes = new Uint8Array(await restored.arrayBuffer());
  assert(bytes.length).equals(5);
  assert(bytes[0]).equals(1);
  assert(bytes[4]).equals(5);

  await db.schema.delete("blob_reload");
});

test.case("schema.delete removes JSON file", async assert => {
  const del_types = { id: dt.u32, name: dt.string } as const;
  const del_as = { table: "delete_test", pk: "id", types: del_types };

  await db.schema.create("delete_test", { name: "id", generate: true },
    del_types);
  await db.create(del_as, { id: 1, name: "temp" });

  const ref = fs.ref(tmp_path).join("delete_test.json");
  assert(await ref.exists()).true();

  await db.schema.delete("delete_test");
  assert(await ref.exists()).false();
});
