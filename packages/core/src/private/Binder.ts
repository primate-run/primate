import type BindingContext from "#BindingContext";
import type FileRef from "@rcompat/fs/FileRef";
import type MaybePromise from "@rcompat/type/MaybePromise";

type Options = {
  context: BindingContext;
  build: {
    id: string;
    stage: FileRef;
  };
};

type Binder = (file: FileRef, options: Options) => MaybePromise<void>;

export type { Binder as default };
