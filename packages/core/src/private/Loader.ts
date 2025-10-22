import location from "#location";
import FileRef from "@rcompat/fs/FileRef";
import Status from "@rcompat/http/Status";
import resolve from "@rcompat/http/mime/extension/resolve";
import type Dict from "@rcompat/type/Dict";

type Init = {
  pages: Dict<string>;
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

  page(name?: string) {
    if (name === undefined || !(name in this.#pages)) {
      return this.#pages[location.app_html];
    }
    return this.#pages[name];
  }

  async asset(file: FileRef) {
    return new Response(file.stream(), {
      headers: {
        "Content-Type": resolve(file.name),
        "Content-Length": String(await file.byteLength()),
      },
      status: Status.OK,
    });
  }

  async serve(pathname: string) {
    const client_file = this.#root.join(`client/${pathname}`);
    if (await client_file.isFile()) {
      return await this.asset(client_file);
    }
    if (pathname.startsWith(this.static_root)) {
      const assetname = pathname.slice(this.static_root.length);
      const static_file = this.#root.join(`static/${assetname}`);
      if (await static_file.isFile()) {
        return await this.asset(static_file);
      }
    }
  }
}
