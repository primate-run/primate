import { get, set } from "#request/store";

function useRequest() {
  return get();
}

useRequest.set = set;

export default useRequest;
