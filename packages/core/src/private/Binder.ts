import type FileRef from "@rcompat/fs/FileRef";
import type { MaybePromise } from "@rcompat/type";

type Options = {
  build: {
    id: string;
  };
  context: string;
};

type Binder = (file: FileRef, options: Options) => MaybePromise<string>;

export type { Binder as default };
