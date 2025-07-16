import type Component from "#frontend/Component";
import type RequestFacade from "#RequestFacade";
import type ServeApp from "#ServeApp";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";

type ResponseFunction =
  (app: ServeApp, transfer: Dict, request: RequestFacade)
  => MaybePromise<Component | Response | undefined | null>;

export { ResponseFunction as default };
