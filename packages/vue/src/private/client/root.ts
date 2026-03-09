import type Data from "#client/Data";
import type { Dict } from "@rcompat/type";
import type { App, Component } from "vue";
import { createApp, createSSRApp } from "vue";
import RootView from "vue:root";
import * as Views from "vue:views";

export type RootProps = {
  views: Component[];
  props: Dict[];
  request: Data["request"] & {
    url: URL;
  };
  update?: () => void;
};

function toProps(data: Data, update?: () => void): RootProps {
  return {
    views: data.views.map((name) => Views[name]),
    props: data.props,
    request: {
      ...data.request,
      url: new URL(location.href),
    },
    update,
  };
}

function csr(props: RootProps): App {
  return createApp(RootView, { p: props });
}

function ssr(props: RootProps): App {
  return createSSRApp(RootView, { p: props });
}

const root = {
  toProps,
  csr,
  ssr,
};

export default root;
