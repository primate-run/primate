import type Module from "@primate/core/Module";
import type FileRef from "@rcompat/fs/FileRef";

interface Config {
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
  request?: {
    body?: {
      parse?: boolean; // true
    };
  };
};
