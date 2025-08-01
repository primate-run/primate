import header from "#header";

export default (locale: string) => fetch("/", {
  body: null,
  headers: { [header]: locale },
  method: "post",
});
