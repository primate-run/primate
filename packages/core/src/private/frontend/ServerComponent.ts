import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";

type ServerComponent = (props: Dict) => MaybePromise<string>;

export { ServerComponent as default };
