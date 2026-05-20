import type { Dict } from "@rcompat/type";
import * as views from "marko:views";

type Data = {
  views: string[];
  props: Dict[];
  request: Dict & {
    url: string;
  };
};

function toProps(data: Data) {
  return {
    views: data.views.map(name => (views as Record<string, unknown>)[name]),
    props: data.props,
    request: {
      ...data.request,
      url: new URL(data.request.url),
    },
  };
}

const root = {
  toProps,
};

export default root;
