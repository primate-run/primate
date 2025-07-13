import type BindingContext from "#BindingContext";
import type FileRef from "@rcompat/fs/FileRef";
import type MaybePromise from "@rcompat/type/MaybePromise";

type Binder = (file: FileRef, context: BindingContext) => MaybePromise<void>;

export type { Binder as default };
