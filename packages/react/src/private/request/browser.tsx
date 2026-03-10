import { get, set, subscribe } from "#request/store";
import { useSyncExternalStore } from "react";

function useRequest() {
  return useSyncExternalStore(subscribe, get);
}

useRequest.set = set;

export default useRequest;
