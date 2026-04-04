/**
 * Browser stub for AppFacade.
 * env must never be called in frontend code, ecrets must not leak to clients
 */
export default class AppFacade {
  config(_path: string): never {
    throw new Error("AppFacade.config() is not available in the browser");
  }

  env(_key: string): never {
    throw new Error(
      "AppFacade.env() is server-only. Do not call env() in frontend/browser code.",
    );
  }

  view(_name: string): never {
    throw new Error("AppFacade.view() is not available in the browser");
  }

  get root(): never {
    throw new Error("AppFacade.root is not available in the browser");
  }
}
