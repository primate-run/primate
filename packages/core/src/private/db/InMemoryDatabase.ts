import AppError from "#AppError";
import type As from "#db/As";
import type Database from "#db/Database";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";
import type PartialDict from "@rcompat/type/PartialDict";

const match = (document: Dict, criteria: Dict) =>
  Object.entries(criteria).every(([key, value]) =>
    document[key] === value);

const filter = (document: Dict, fields: string[]) =>
  Object.fromEntries(Object.entries(document)
    .filter(([key]) => fields.includes(key)));

/*const sorted = (a: Dict, b: Dict, sort: Dict<"asc" | "desc">) => {
  Object.entries(sort).map(([key, direction]) => {
    if ()
  })
};*/

export default class InMemoryDatabase implements Database {
  #collections: PartialDict<Dict<Dict>> = {};

  #new(name: string) {
    if (this.#collections[name] !== undefined) {
      throw new AppError(`collection ${name} already exists`);
    }
    this.#collections[name] = {};
  }

  #drop(name: string) {
    if (this.#collections[name] === undefined) {
      // do nothing
    }
    delete this.#collections[name];
  }

  #use(name: string) {
    if (this.#collections[name] === undefined) {
      this.#collections[name] = {};
    }
    return this.#collections[name];
  }

  get schema() {
    return {
      create: this.#new.bind(this),
      delete: this.#drop.bind(this),
    };
  }

  create<O extends Dict>(as: As, args: {
    document: Dict;
  }) {
    const collection = this.#use(as.name);
    const document = {...args.document};
    if (document.id === undefined) {
      document.id = crypto.randomUUID();
    };
    if (typeof document.id !== "string") {
      throw new AppError(`id must be string, got: ${document.id}`);
    }
    collection[document.id] = { ...document };

    return document as MaybePromise<O>;
  }

  read(as: As, args: {
    criteria: Dict;
    count: true;
  }): MaybePromise<number>;
  read(as: As, args: {
    criteria: Dict;
    fields?: string[];
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): MaybePromise<Dict[]>;
  read(as: As, args: {
    criteria: Dict;
    fields?: string[];
    count?: true;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): MaybePromise<number | Dict[]> {
    const collection = this.#use(as.name);
    const matches = Object.values(collection)
      .filter(document => match(document, args.criteria));

    if (args.count === true) {
      return matches.length;
    }

    console.log("sort", args.sort);
    const fields = args.fields ?? [];

    const filtered = fields.length === 0
      ? matches
      : matches.map(matched => filter(matched, fields));

    const sort = args.sort ?? {};

    return Object.keys(sort).length === 0
       ? filtered
       : filtered; //.toSorted((a, b) => sorted(a, b, sort));
  }

  update(as: As, args: {
    criteria: Dict;
    delta: Dict;
    count?: true;
  }): MaybePromise<number>;
  update(as: As, args: {
    criteria: Dict;
    delta: Dict;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): MaybePromise<Dict[]>;
  update(as: As, args: {
    criteria: Dict;
    delta: Dict;
    count?: true;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): MaybePromise<number | Dict[]> {
    const collection = this.#use(as.name);
    const limit = args.limit ?? -1;

    const matches = Object.values(collection)
      .filter(document => match(document, args.criteria)).slice(0, limit);
    matches.forEach(matched => {
      collection[matched.id as string] = {...match, ...args.delta};
    });

    if (args.count === true) {
      return matches.length;
    }

    return matches;
  }

  delete(as: As, args: {
    criteria: Dict;
  }) {
    const collection = this.#use(as.name);

    this.#collections[as.name] = Object.fromEntries(Object.entries(collection)
      .filter(([, document]) => !match(document, args.criteria)));
  }
}
