import type { RequestPublic } from "@primate/core";

type Input = Omit<RequestPublic, "url"> & {
  url: string | URL;
};

type MarkoRequest = Omit<RequestPublic, "url"> & {
  url: URL;
  set: (value: Input) => void;
};

const request = {
  set(value: Input) {
    Object.assign(request, {
      ...value,
      url: value.url instanceof URL ? value.url : new URL(value.url),
    });
  },
} as MarkoRequest;

export default request;
