import frontmatter from "#frontmatter";
import slugify from "#slugify";
import type { FileRef } from "@rcompat/fs";
import fs from "@rcompat/fs";
import is from "@rcompat/is";
import runtime from "@rcompat/runtime";
import type { Dict, MaybePromise } from "@rcompat/type";
import type { MarkedExtension, Tokens } from "marked";
import { Marked } from "marked";

const EXTENSION = ".md";

type Pretransform = (text: string) => MaybePromise<string>;

type TOCItem = {
  depth: number;
  slug: string;
  text: string;
};

type Config = {
  driver: "file";
  directory: string;
  marked?: MarkedExtension;
  pretransform?: Pretransform;
};

type Rendered = {
  body: string;
  html: string;
  toc: TOCItem[];
  frontmatter: Dict;
};

type Document = Rendered & {
  id: string;
};

type FindOptions = {
  path?: string;
  recursive?: boolean;
};

function is_absolute(path: string) {
  return path.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(path);
}

function assert_safe_path(value: string, kind: "id" | "path") {
  if (value === "" && kind === "id") {
    throw new Error("Markdown id cannot be empty");
  }

  if (value.includes("\\")) {
    throw new Error(`Markdown ${kind} must use forward slashes`);
  }

  if (is_absolute(value)) {
    throw new Error(`Markdown ${kind} cannot be absolute`);
  }

  if (value.endsWith(EXTENSION)) {
    throw new Error(`Markdown ${kind} must not include the ${EXTENSION} extension`);
  }

  const parts = value.split("/");
  if (parts.some(part => part === "." || part === ".." || part === "")) {
    throw new Error(`Markdown ${kind} contains an invalid path segment`);
  }
}

function normalize_id(id: string) {
  assert_safe_path(id, "id");
  return id;
}

function normalize_path(path: string | undefined) {
  if (is.undefined(path) || path === "") return undefined;
  assert_safe_path(path, "path");
  return path;
}

function strip_leading_slash(path: string) {
  return path.startsWith("/") ? path.slice(1) : path;
}

function id_from_file(file: FileRef, base: FileRef) {
  const relative = strip_leading_slash(file.debase(base).webpath());

  if (!relative.endsWith(EXTENSION)) {
    throw new Error(`Markdown file does not end in ${EXTENSION}: ${file.path}`);
  }

  return normalize_id(relative.slice(0, -EXTENSION.length));
}

function in_path(id: string, path: string | undefined, recursive: boolean) {
  if (is.undefined(path)) return true;

  const prefix = `${path}/`;
  if (!id.startsWith(prefix)) return false;

  if (recursive) return true;

  return !id.slice(prefix.length).includes("/");
}

export default class DB {
  #directory: string;
  #marked: Marked;
  #pretransform: Pretransform;
  #root?: Promise<FileRef>;
  #documents: Promise<Map<string, Rendered>>;

  static new(config: Config) {
    return new DB(config);
  }

  constructor(config: Config) {
    this.#directory = config.directory;
    this.#marked = new Marked();
    if (is.defined(config.marked)) this.#marked.use(config.marked);
    this.#pretransform = config.pretransform ?? ((text: string) => text);
    this.#documents = this.#load();
  }

  async #base() {
    return this.#root ??= is_absolute(this.#directory)
      ? Promise.resolve(fs.ref(this.#directory))
      : runtime.projectRoot().then(root => root.join(this.#directory));
  }

  async #load(): Promise<Map<string, Rendered>> {
    const base = await this.#base();
    const files = await base.files({ recursive: true });

    const markdown = files
      .filter(file => file.extension === EXTENSION)
      .map(file => ({ file, id: id_from_file(file, base) }))
      .toSorted((a, b) => a.id.localeCompare(b.id));

    const entries = await Promise.all(markdown.map(async ({ file, id }) =>
      [id, await this.#render(file)] as const));

    return new Map(entries);
  }

  #toc(body: string): TOCItem[] {
    return this.#marked
      .lexer(body)
      .filter(token => token.type === "heading")
      .map(token => {
        const heading = token as Tokens.Heading;
        return {
          depth: heading.depth,
          slug: slugify(heading.text),
          text: heading.text,
        };
      });
  }

  async #render(file: FileRef): Promise<Rendered> {
    const transformed = await this.#pretransform(await file.text());
    const { body, meta } = frontmatter(transformed);

    return {
      body,
      html: await this.#marked.parse(body),
      toc: this.#toc(body),
      frontmatter: meta ?? {},
    };
  }

  async read(id: string): Promise<Rendered | undefined> {
    return (await this.#documents).get(normalize_id(id));
  }

  async all(options: FindOptions = {}): Promise<Document[]> {
    const path = normalize_path(options.path);
    const recursive = options.recursive ?? true;
    const documents = await this.#documents;

    return [...documents.entries()]
      .filter(([id]) => in_path(id, path, recursive))
      .map(([id, rendered]) => ({ ...rendered, id }));
  }
}

export type { FindOptions, Rendered, TOCItem };
