import type Module from "@primate/core/Module";
import type FileRef from "@rcompat/fs/FileRef";
import type { BuildOptions } from "esbuild";

interface Config {
  build?: BuildOptions;
  http?: {
    csp?: Record<string, string>;
    headers?: Record<string, string>;
    host?: string; // "localhost"
    port?: number; // 6161
    ssl?: {
      cert?: FileRef | string;
      key?: FileRef | string;
    };
    static?: {
      root?: string; // "/"
    };
  };
  modules?: Module[];
  pages?: {
    app?: string; // "app.html"
    error?: string; // "error.html"
  };
  request?: {
    body?: {
      parse?: boolean; // true
    };
  };
};
