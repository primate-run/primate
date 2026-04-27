import type Module from "#Module";
import type {
  BuildHook,
  HandleHook,
  InitHook,
  LogHook,
  RouteHook,
  ServeHook,
} from "#module/Setup";

type Hooks = {
  init: InitHook[];
  build: BuildHook[];
  serve: ServeHook[];
  handle: HandleHook[];
  route: RouteHook[];
  log: LogHook[];
};

type Created = {
  name: string;
  hooks: Hooks;
};

export type { Created, Hooks };

export default function create({ name, setup }: Module): Created {
  const hooks: Hooks = {
    init: [],
    build: [],
    serve: [],
    handle: [],
    route: [],
    log: [],
  };

  setup({
    onInit(hook) {
      hooks.init.push(hook);
    },

    onBuild(hook) {
      hooks.build.push(hook);
    },

    onServe(hook) {
      hooks.serve.push(hook);
    },

    onHandle(hook) {
      hooks.handle.push(hook);
    },

    onRoute(hook) {
      hooks.route.push(hook);
    },

    onLog(hook) {
      hooks.log.push(hook);
    },
  });

  return { name, hooks };
}
