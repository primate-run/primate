import type DB from "#DB";
import type { FindOptions, Rendered, TOCItem } from "#DB";
import E from "#errors";
import is from "@rcompat/is";

type FrontmatterSchema<T> = {
  parse(value: unknown): T;
};

type InferFrontmatter<S> =
  S extends FrontmatterSchema<infer T> ? T : never;

type StoreConfig<S extends FrontmatterSchema<any>> = {
  db: DB;
  directory: string;
  frontmatter: S;
};

type Document<S extends FrontmatterSchema<any>> =
  Omit<Rendered, "frontmatter"> & {
    id: string;
    body: string;
    html: string;
    toc: TOCItem[];
    frontmatter: InferFrontmatter<S>;
  };

function join_id(prefix: string, id?: string) {
  if (prefix === "") return id ?? "";
  return is.undefined(id) || id === "" ? prefix : `${prefix}/${id}`;
}

function debase_id(id: string, prefix: string) {
  if (prefix === "") return id;

  const full = `${prefix}/`;
  if (!id.startsWith(full)) {
    throw new Error(`Markdown id ${id} is outside store directory ${prefix}`);
  }

  return id.slice(full.length);
}

export default class Store<S extends FrontmatterSchema<any>> {
  #db: DB;
  #directory: string;
  #frontmatter: S;

  static new<const S extends FrontmatterSchema<any>>(config: StoreConfig<S>) {
    return new Store(config);
  }

  constructor(config: StoreConfig<S>) {
    this.#db = config.db;
    this.#directory = config.directory;
    this.#frontmatter = config.frontmatter;
  }

  #document(id: string, rendered: Rendered): Document<S> {
    return {
      ...rendered,
      id,
      frontmatter: this.#frontmatter.parse(rendered.frontmatter),
    };
  }

  async #read(id: string): Promise<Document<S> | undefined> {
    const rendered = await this.#db.read(join_id(this.#directory, id));

    return is.undefined(rendered)
      ? undefined
      : this.#document(id, rendered);
  }

  async get(id: string): Promise<Document<S>> {
    const document = await this.#read(id);

    if (is.defined(document)) return document;

    throw E.document_not_found(id);
  }

  async try(id: string): Promise<Document<S> | undefined> {
    return this.#read(id);
  }

  async find(options: FindOptions = {}): Promise<Document<S>[]> {
    const documents = await this.#db.all({
      path: join_id(this.#directory, options.path),
      recursive: options.recursive ?? true,
    });

    return documents.map(document =>
      this.#document(debase_id(document.id, this.#directory), document));
  }
}
