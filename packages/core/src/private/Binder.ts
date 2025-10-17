import type BindingContext from "#BindingContext";
import type FileRef from "@rcompat/fs/FileRef";
import type MaybePromise from "@rcompat/type/MaybePromise";

type Options = {
  build: {
    id: string;
    stage: FileRef;
  };
  context: BindingContext;
};

type Binder = (file: FileRef, options: Options) => MaybePromise<string>;

export type { Binder as default };
