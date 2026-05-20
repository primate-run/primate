import type { RequestView } from "@primate/core";

type Input = Omit<RequestView, "url"> & {
  url: string | URL;
};

type MarkoRequest = Omit<RequestView, "url"> & {
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
