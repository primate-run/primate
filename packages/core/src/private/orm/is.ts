import BelongsToRelation from "#orm/BelongsToRelation";
import ForeignKey from "#orm/ForeignKey";
import HasManyRelation from "#orm/HasManyRelation";
import HasOneRelation from "#orm/HasOneRelation";
import PrimaryKey from "#orm/PrimaryKey";

type Relation =
  | BelongsToRelation<any, any>
  | HasManyRelation<any, any>
  | HasOneRelation<any, any>;

const pk = (x: unknown): x is PrimaryKey<any> =>
  x instanceof PrimaryKey;

const fk = (x: unknown): x is ForeignKey<any> =>
  x instanceof ForeignKey;

const belongsTo = (x: unknown): x is BelongsToRelation<any, any> =>
  x instanceof BelongsToRelation;

const hasMany = (x: unknown): x is HasManyRelation<any, any> =>
  x instanceof HasManyRelation;

const hasOne = (x: unknown): x is HasOneRelation<any, any> =>
  x instanceof HasOneRelation;

const relation = (x: unknown): x is Relation =>
  belongsTo(x) || hasMany(x) || hasOne(x);

export default { pk, fk, belongsTo, hasMany, hasOne, relation };
