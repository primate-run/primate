import type { FileRef } from "@rcompat/fs";
import type { MaybePromise } from "@rcompat/type";

type LoaderType = "frontend" | "backend";

type OnLoad = (file: FileRef, options: {
  build: {
    id: string;
  };
}) => MaybePromise<string>;

type Loader<T extends LoaderType = LoaderType> = {
  type: T;
  extensions: string[];
  onLoad: OnLoad;
} & (T extends "frontend" ? { client: boolean } : {});

export type { Loader, LoaderType, OnLoad };
