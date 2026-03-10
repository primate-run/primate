import type { Dict, MaybePromise } from "@rcompat/type";

type ServerView = (props: Dict) => MaybePromise<string>;

export { ServerView as default };
