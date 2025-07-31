import type App from "#App";
import type BuildApp from "#BuildApp";
import type Module from "#Module";
import type RequestFacade from "#RequestFacade";
import type ResponseLike from "#ResponseLike";
import type ServeApp from "#ServeApp";

type HookInput = {
  init: App;
  build: BuildApp;
  serve: ServeApp;
  handle: RequestFacade;
  route: RequestFacade;
};

type HookOutput = {
  init: App;
  build: BuildApp;
  serve: ServeApp;
  handle: ResponseLike;
  route: ResponseLike;
};

type Hook = keyof HookInput;

type ModuleMethod<H extends Hook> = (
  app: HookInput[H],
  next: (value: HookInput[H]) => Promise<HookOutput[H]>
) => Promise<HookOutput[H]>;

export default async function reducer<H extends Hook>(
  modules: Module[],
  dragon: HookInput[H],
  hook: H,
): Promise<HookOutput[H]> {
  if (modules.length === 0) {
    return dragon as HookOutput[H];
  }

  const [head, ...tail] = modules;

  const method = head[hook].bind(head) as ModuleMethod<H>;

  return await method(dragon, next =>
    tail.length === 0 ? Promise.resolve(next) : reducer(tail, next, hook));
};
