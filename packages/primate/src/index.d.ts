declare module "app:views" {
  const views: [string, Record<string, unknown>][];
  export default views;
}

declare module "$:app" {
  import type AppFacade from "primate/AppFacade";
  const facade: AppFacade;
  export default facade;
}
