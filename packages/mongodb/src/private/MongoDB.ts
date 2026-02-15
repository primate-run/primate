import typemap from "#typemap";
import type { As, DataDict, DB, PK, Sort, With } from "@primate/core/db";
import common from "@primate/core/db";
import E from "@primate/core/db/error";
import assert from "@rcompat/assert";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";
import { MongoClient, ObjectId } from "mongodb";
import type { DataKey, StoreSchema } from "pema";
import p from "pema";

const schema = p({
  database: p.string,
  host: p.string.default("localhost"),
  password: p.string.optional(),
  port: p.uint.port().default(27017),
  username: p.string.optional(),
});

function is_object_id(x: unknown): x is ObjectId {
  return x instanceof ObjectId;
}

function get_limit(limit?: number) {
  return limit ?? 0;  // 0 = no limit
}

function get_sort(sort?: Sort) {
  if (sort === undefined) return undefined;
  const entries = Object.entries(sort);
  if (entries.length === 0) return undefined;

  const out: Dict<1 | -1> = {};
  for (const [k, dir] of entries) {
    out[k] = dir.toLowerCase() === "desc" ? -1 : 1;
  }
  return out;
}

function get_projection(pk: PK, fields?: string[]) {
  if (fields === undefined || fields.length === 0) return undefined;

  const out: Dict<0 | 1> = {};
  const has_pk = pk !== null && fields.includes(pk);

  // MongoDB always includes _id unless explicitly excluded
  if (!has_pk) out._id = 0;

  for (const field of fields) {
    const key = field === pk ? "_id" : field;
    out[key] = 1;
  }

  return out;
}

async function bind_value(key: DataKey, value: unknown) {
  if (value === null) return null;
  return await typemap[key].bind(value as never);
}

function unbind_value(key: DataKey, value: unknown) {
  return typemap[key].unbind(value as never);
}

function like_to_regex(pattern: string) {
  return "^" + pattern
    .replace(/\\%/g, "<<PERCENT>>")
    .replace(/\\_/g, "<<UNDERSCORE>>")
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/%/g, ".*")
    .replace(/_/g, ".")
    .replace(/<<PERCENT>>/g, "%")
    .replace(/<<UNDERSCORE>>/g, "_") + "$";
}

export default class MongoDB implements DB {
  static config: typeof schema.input;

  #factory: () => Promise<MongoClient>;
  #database: string;
  #client?: MongoClient;

  constructor(config?: typeof schema.input) {
    const { host, port, database } = schema.parse(config);
    const params = "directConnection=true&replicaSet=rs0";
    const client = new MongoClient(`mongodb://${host}:${port}?${params}`);

    this.#database = database;
    this.#factory = async () => {
      await client.connect();
      return client;
    };
  }

  async #collection(name: string) {
    this.#client ??= await this.#factory();
    return this.#client.db(this.#database).collection(name);
  }

  async close() {
    await this.#client?.close();
  }

  get schema() {
    return {
      create: async (_as: As, _store: StoreSchema) => {
        // MongoDB is schemaless, noop
      },
      delete: async (name: string) => {
        const collection = await this.#collection(name);
        await collection.drop().catch(() => { });  // ignore if doesn't exist
      },
    };
  }

  #to_mongo_pk(field: string, pk: PK) {
    return field === pk ? "_id" : field;
  }

  #from_mongo_pk(field: string, pk: PK) {
    return field === "_id" && pk !== null ? pk : field;
  }

  async #bind(as: As, object: DataDict): Promise<Dict> {
    const pk = as.pk;
    const out: Dict = {};

    for (const [field, value] of Object.entries(object)) {
      const mongo_field = this.#to_mongo_pk(field, pk);
      const datatype = as.types[field];

      if (value === null) {
        out[mongo_field] = null;
        continue;
      }

      if (is.dict(value)) {
        const ops = Object.entries(value);
        if (ops.length === 0) throw E.operator_empty(field);

        for (const [op, op_value] of ops) {
          const existing = (out[mongo_field] ?? {}) as Dict;
          let next;

          switch (op) {
            case "$like":
              next = { $regex: like_to_regex(String(op_value)) };
              break;
            case "$ilike":
              next = { $regex: like_to_regex(String(op_value)), $options: "i" };
              break;
            case "$ne":
            case "$gt":
            case "$gte":
            case "$lt":
            case "$lte":
              next = { [op]: await bind_value(datatype, op_value) };
              break;
            case "$after":
              next = { $gt: await bind_value(datatype, op_value) };
              break;
            case "$before":
              next = { $lt: await bind_value(datatype, op_value) };
              break;
            default:
              throw E.operator_unknown(field, op);
          }

          out[mongo_field] = { ...existing, ...next };
        }

        continue;
      }

      if (field === pk) {
        const type = as.types[pk];
        if (type === "string" && ObjectId.isValid(value as string)) {
          out._id = new ObjectId(value as string);
        } else {
          out._id = value;
        }
        continue;
      }

      out[mongo_field] = await bind_value(datatype, value);
    }

    return out;
  }

  #unbind(as: As, doc: Dict): Dict {
    const pk = as.pk;
    const out: Dict = {};

    for (const [field, value] of Object.entries(doc)) {
      const user_field = this.#from_mongo_pk(field, pk);
      const datatype = as.types[user_field];

      if (value === null || value === undefined) {
        continue;
      }

      if (field === "_id") {
        // handle ObjectId to string for PK, other keep as-is
        out[user_field] = is_object_id(value) ? value.toString() : value;
        continue;
      }

      out[user_field] = unbind_value(datatype, value);
    }

    return out;
  }

  async #generate_pk(as: As) {
    const pk = as.pk!;
    const type = as.types[pk];
    const collection = await this.#collection(as.table);

    if (type === "string") return new ObjectId();

    // for numeric types, find max and increment
    const pipeline = [{ $group: { _id: null, max: { $max: "$_id" } } }];
    const results = await collection.aggregate(pipeline).toArray();
    const max = results.length === 0 ? 0 : results[0].max ?? 0;

    if (common.BIGINT_STRING_TYPES.includes(type)) return BigInt(max) + 1n;

    return Number(max) + 1;
  }

  async create<O extends Dict>(as: As, record: Dict): Promise<O> {
    assert.dict(record);

    const pk = as.pk;
    const collection = await this.#collection(as.table);

    const doc: Dict = {};
    let pk_value: unknown = null;

    if (pk !== null) {
      const type = as.types[pk];

      if (pk in record) {
        pk_value = record[pk];
        doc._id = type === "string" && ObjectId.isValid(pk_value as string)
          ? new ObjectId(pk_value as string)
          : pk_value;
      } else if (as.generate_pk !== false) {
        const generated = await this.#generate_pk(as);
        doc._id = generated;
        // convert to user-facing value
        pk_value = is_object_id(generated) ? generated.toString() : generated;
      } else {
        throw E.pk_required(pk);
      }
    }

    for (const [field, value] of Object.entries(record)) {
      if (field === pk) continue;
      doc[field] = await bind_value(as.types[field], value);
    }

    await collection.insertOne(doc);

    const result: Dict = { ...record };
    if (pk !== null && !(pk in record) && pk_value !== null) {
      result[pk] = pk_value;
    }

    return result as O;
  }

  read(as: As, args: {
    count: true;
    where: DataDict;
    with?: never;
  }): Promise<number>;
  read(as: As, args: {
    where: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
    with?: With;
  }): Promise<Dict[]>;
  async read(as: As, args: {
    count?: true;
    where: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
    with?: With;
  }) {
    assert.dict(args.where);

    if (args.count === true) return this.#count(as, args.where);

    // relations always use phased approach
    if (common.withed(args)) return this.#read_phased(as, args);

    return this.#read(as, args);
  }

  async #count(as: As, where: DataDict) {
    const filter = await this.#bind(as, where);
    const collection = await this.#collection(as.table);
    const count = await collection.countDocuments(filter);
    return count;
  }

  async #read(as: As, args: {
    where: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
  }) {
    const filter = await this.#bind(as, args.where);
    const collection = await this.#collection(as.table);

    const projection = get_projection(as.pk, args.fields);
    const sort = get_sort(args.sort);
    const limit = get_limit(args.limit);

    const options: Dict = { useBigInt64: true };
    if (projection) options.projection = projection;
    if (sort) options.sort = sort;

    const docs = await collection
      .find(filter, options)
      .limit(limit)
      .toArray();

    return docs.map(doc => this.#unbind(as, doc));
  }

  async #read_phased(as: As, args: {
    where: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
    with: With;
  }) {
    const fields = common.expand(as, args.fields, args.with);
    const rows = await this.#read(as, { ...args, fields });
    const out = rows.map(row => common.project(row, args.fields));

    for (const [name, relation] of Object.entries(args.with)) {
      await this.#attach_relation(as, { rows, out, name, relation });
    }

    return out;
  }

  async #attach_relation(as: As, args: {
    rows: Dict[];
    out: Dict[];
    name: string;
    relation: NonNullable<With[string]>;
  }) {
    const relation = args.relation;

    const by = relation.reverse ? relation.as.pk : relation.fk;
    if (by === null) throw E.relation_requires_pk("target");

    const parent_by = relation.reverse ? relation.fk : as.pk;
    if (parent_by === null) throw E.relation_requires_pk("parent");

    const join_values = [...new Set(
      args.rows.map(r => r[parent_by]).filter(v => v != null),
    )];

    const is_many = relation.kind === "many";
    const empty = is_many ? [] : null;

    if (join_values.length === 0) {
      for (const row of args.out) row[args.name] = empty;
      return;
    }

    const related = await this.#load_related({ by, join_values, ...relation });
    const grouped = new Map<unknown, Dict[]>();

    for (const row of related) {
      const key = row[by];
      grouped.set(key, grouped.get(key)?.concat(row) ?? [row]);
    }

    for (let i = 0; i < args.out.length; i++) {
      const join_value = args.rows[i][parent_by];

      if (join_value == null) {
        args.out[i][args.name] = empty;
        continue;
      }

      const rows = grouped.get(join_value) ?? [];
      args.out[i][args.name] = is_many
        ? rows.map(r => common.project(r, relation.fields))
        : rows[0] ? common.project(rows[0], relation.fields) : null;
    }
  }

  async #load_related(args: {
    as: As;
    by: string;
    join_values: unknown[];
    where: DataDict;
    fields?: string[];
    sort?: Sort;
    kind?: "one" | "many";
    limit?: number;
  }) {
    // build filter with $in for join values
    const filter = await this.#bind(args.as, args.where);
    const by_field = this.#to_mongo_pk(args.by, args.as.pk);
    // convert join values to ObjectId if needed
    const pk_type = args.as.types[args.as.pk!];
    const in_values = args.by === args.as.pk && pk_type === "string"
      ? args.join_values.map(v =>
        ObjectId.isValid(v as string) ? new ObjectId(v as string) : v,
      )
      : args.join_values;

    filter[by_field] = { $in: in_values };

    const collection = await this.#collection(args.as.table);
    const fields_with_by = common.fields(args.fields, args.by);
    const projection = get_projection(args.as.pk, fields_with_by);
    const sort = get_sort(args.sort);

    const options: Dict = { useBigInt64: true };
    if (projection) options.projection = projection;
    if (sort) options.sort = sort;

    // for per-parent limits, fetch all and slice in memory
    // MongoDB doesn't have native per-group limit like SQL's ROW_NUMBER
    const docs = await collection.find(filter, options).toArray();
    const rows = docs.map(doc => this.#unbind(args.as, doc));

    // apply per-parent limit if needed
    const per_parent = args.kind === "one" ? 1 : args.limit;
    if (per_parent !== undefined) {
      const grouped = new Map<unknown, Dict[]>();
      for (const row of rows) {
        const key = row[args.by];
        const group = grouped.get(key) ?? [];
        if (group.length < per_parent) {
          group.push(row);
          grouped.set(key, group);
        }
      }
      return [...grouped.values()].flat();
    }

    return rows;
  }

  async update(as: As, args: { set: DataDict; where: DataDict }) {
    assert.nonempty(args.set);
    assert.dict(args.where);

    const filter = await this.#bind(as, args.where);
    const collection = await this.#collection(as.table);

    const $set: Dict = {};
    const $unset: Dict = {};

    for (const [field, value] of Object.entries(args.set)) {
      const mongo_field = this.#to_mongo_pk(field, as.pk);
      if (value === null) {
        $unset[mongo_field] = "";
      } else {
        $set[mongo_field] = await bind_value(as.types[field], value);
      }
    }

    const update: Dict = {};
    if (Object.keys($set).length > 0) update.$set = $set;
    if (Object.keys($unset).length > 0) update.$unset = $unset;

    const result = await collection.updateMany(filter, update);
    return result.modifiedCount;
  }

  async delete(as: As, args: { where: DataDict }) {
    assert.nonempty(args.where);

    const filter = await this.#bind(as, args.where);
    const collection = await this.#collection(as.table);

    const result = await collection.deleteMany(filter);
    return result.deletedCount;
  }
}
