import type Props from "#frontend/Props";

type ServerData<T> = {
  component: T;
  props: Props;
};

export type { ServerData as default };
