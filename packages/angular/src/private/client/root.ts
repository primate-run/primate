import type Data from "#client/Data";
import type { Type } from "@angular/core";
import type { Dict } from "@rcompat/type";
import * as Views from "angular:views";

type ViewComponent = Type<unknown>;

export type RootProps = {
  views: ViewComponent[];
  props: Dict[];
  request: Data["request"] & {
    url: URL;
  };
  update?: () => void;
};

function toProps(data: Data, update?: () => void): RootProps {
  return {
    views: data.views.map(name => Views[name]),
    props: data.props,
    request: {
      ...data.request,
      url: new URL(data.request.url),
    },
    update,
  };
}

const root = {
  toProps,
};

export default root;
