import fail from "#fail";
import type BelongsToRelation from "#orm/BelongsToRelation";
import type ForeignKey from "#orm/ForeignKey";
import type HasManyRelation from "#orm/HasManyRelation";
import type HasOneRelation from "#orm/HasOneRelation";
import is from "#orm/is";
import type PrimaryKey from "#orm/PrimaryKey";
import type { Dict } from "@rcompat/type";
import type { DataKey, Storable } from "pema";

type Relation =
  | BelongsToRelation<any, any>
  | HasManyRelation<any, any>
  | HasOneRelation<any, any>;

type StoreInput = Dict<
  | Storable<DataKey>
  | ForeignKey<any>
  | PrimaryKey<any>
  | Relation

>;

export default function parse(input: StoreInput) {
  let pk: string | null = null;
  const fks = new Map<string, ForeignKey<Storable<DataKey>>>();
  const relations = new Map<string, Relation>();
  const schema: Dict<Storable<DataKey>> = {};

  for (const [name, field] of Object.entries(input)) {
    if (is.pk(field)) {
      if (pk !== null) throw fail("multiple primary keys: {0}, {1}", pk, name);
      pk = name;
      schema[name] = field.type;

    } else if (is.fk(field)) {
      fks.set(name, field);
      schema[name] = field.type;

    } else if (is.relation(field)) {
      relations.set(name, field);

      if (is.belongsTo(field)) {
        const fk_name = field.fk;
        const fk_field = input[fk_name] as StoreInput[string] | undefined;

        if (!fk_field) {
          throw fail(
            "belongsTo {0}: foreign key {1} not found",
            name,
            fk_name,
          );
        }

        if (!is.fk(fk_field)) {
          throw fail(
            "belongsTo {0}: {1} must use key.foreign()",
            name,
            fk_name,
          );
        }
      }

      if (is.hasMany(field) || is.hasOne(field)) {
        const fkName = field.fk;
        const relatedSchema = field.store.schema;
        const fkField = relatedSchema[fkName] as Storable<DataKey> | undefined;

        if (!fkField) {
          throw fail("{0} {1}: foreign key {2} not found on related store",
            is.hasMany(field) ? "hasMany" : "hasOne", name, fkName);
        }
      }

    } else {
      schema[name] = field;
    }
  }

  return { pk, fks, relations, schema };
}
