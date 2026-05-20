declare module "app:marko" {
  type AppInput = {
    __primate: {
      request: {
        url: URL;
        [key: string]: unknown;
      };
    };
  };
  export const request: (input: AppInput) => AppInput["__primate"]["request"];
}
