import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";

type ServerView = (props: Dict) => MaybePromise<string>;

export { ServerView as default };
