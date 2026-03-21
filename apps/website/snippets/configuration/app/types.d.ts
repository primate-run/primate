import type { Module } from "@primate/core";
import type { FileRef } from "@rcompat/fs";

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
}
