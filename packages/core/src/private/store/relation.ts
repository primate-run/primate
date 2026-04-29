import is from "@rcompat/is";

export type OneRelation<N extends string, FK extends string> = {
  type: "one";
  table: N;
  fk: FK;
  reverse: boolean;
};

export type ManyRelation<N extends string, FK extends string> = {
  type: "many";
  table: N;
  fk: FK;
};

export type Relation =
  | OneRelation<string, string>
  | ManyRelation<string, string>
  ;

function one<const N extends string, const FK extends string>(
  options: { table: N; by: FK; reverse?: boolean },
): OneRelation<N, FK> {
  return {
    type: "one",
    table: options.table,
    fk: options.by,
    reverse: options.reverse ?? false,
  };
}

function many<const N extends string, const FK extends string>(
  options: { table: N; by: FK },
): ManyRelation<N, FK> {
  return {
    type: "many",
    table: options.table,
    fk: options.by,
  };
}

function is_relation(x: unknown): x is Relation {
  return is.dict(x) && "type" in x && (x.type === "one" || x.type === "many");
}

const relation = {
  one,
  many,
  is: is_relation,
};

export default relation;
