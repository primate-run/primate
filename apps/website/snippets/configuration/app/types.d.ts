import type Module from "@primate/core/Module";
import type FileRef from "@rcompat/fs/FileRef";

interface Config {
  base?: string; // "/"
  build?: {
    define?: Record<string, string>;
    excludes?: string[];
    includes?: string[];
    name: string; // "app"
    options?: Record<string, string>;
  };
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
