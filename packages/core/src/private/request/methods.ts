const methods = [
  "get",
  "post",
  "put",
  "delete",
  "head",
  "connect",
  "options",
  "trace",
  "patch",
] as const;

export type Method = typeof methods[number];

export default methods;
