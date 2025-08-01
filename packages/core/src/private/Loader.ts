import FileRef from "@rcompat/fs/FileRef";
import Status from "@rcompat/http/Status";
import { resolve } from "@rcompat/http/mime";
import type Dict from "@rcompat/type/Dict";

type Init = {
  pages: Dict<string>;
  pages_app: string;
  rootfile: string;
  static_root: string;
};

export default class Loader {
  #init: Init;
  #root: FileRef;

  constructor(init: Init) {
    this.#init = init;
    this.#root = new FileRef(init.rootfile).join("..");
  }

  get static_root() {
    return this.#init.static_root;
  }

  get #pages() {
    return this.#init.pages;
  }

  get pages_app() {
    return this.#init.pages_app;
  }

  page(name?: string) {
    if (name === undefined) {
      return this.#pages[this.pages_app];
    }
    return this.#pages[name] ?? this.#pages[this.pages_app];
  }

  asset(file: FileRef) {
    return new Response(file.stream(), {
      headers: {
        "Content-Type": resolve(file.name),
      },
      status: Status.OK,
    });
  }

  async serve(pathname: string) {
    const client_file = this.#root.join(`client/${pathname}`);
    if (await client_file.isFile()) {
      return this.asset(client_file);
    }
    if (pathname.startsWith(this.static_root)) {
      const assetname = pathname.slice(this.static_root.length);
      const static_file = this.#root.join(`server/static/${assetname}`);
      if (await static_file.isFile()) {
        return this.asset(static_file);
      }
    }
  }
}
