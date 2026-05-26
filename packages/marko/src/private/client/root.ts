import type Data from "#client/Data";
import type { Dict } from "@rcompat/type";
import * as views from "marko:views";

export type RootProps = {
  views: unknown[];
  props: Dict[];
  request: Data["request"] & {
    url: URL;
  };
};

function toProps(data: Data): RootProps {
  return {
    views: data.views.map(name => views[name]),
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
