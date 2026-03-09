import type ClientData from "#client/Data";
import type { Dict } from "@rcompat/type";

export type Updater<T extends Dict> = (json: ClientData<T>, after?: () => void)
  => void;

let current: Updater<any>;

const root = {
  set(updater: Updater<any>) {
    current = updater;
  },
  update(data: any, after?: () => void) {
    current(data, after);
  },
};

export default root;
