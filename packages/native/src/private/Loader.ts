import Loader from "@primate/core/Loader";
import FileRef from "@rcompat/fs/FileRef";
import entries from "@rcompat/record/entries";
import type Dict from "@rcompat/type/Dict";
import type PartialDict from "@rcompat/type/PartialDict";
import type Webview from "@rcompat/webview";

type Init = {
  pages_app: string;
  pages: Dict<string>;
  rootfile: string;
  static_root: string;
  client_imports: Dict<string>;
  static_imports: Dict<string>;
  Webview: typeof Webview;
};

export default class NativeLoader extends Loader {
  #webview: typeof Webview;
  #clients: PartialDict<FileRef> = {};
  #statics: PartialDict<FileRef> = {};

  constructor(init: Init) {
    super(init);

    this.#clients = entries(init.client_imports)
      .valmap(([, url]) => new FileRef(url)).get();
    this.#statics = entries(init.static_imports)
      .valmap(([, url]) => new FileRef(url)).get();
    this.#webview = init.Webview;
  }

  async serve(pathname: string) {
    const client_file = this.#clients[pathname];
    if (client_file !== undefined) {
      return this.asset(client_file);
    }
    if (pathname.startsWith(this.static_root)) {
      const assetname = pathname.slice(this.static_root.length);
      const static_file = this.#statics[assetname];
      if (static_file !== undefined) {
        return this.asset(static_file);
      }
    }
  }

  get webview() {
    return this.#webview;
  }
}
