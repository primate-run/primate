import store from "#request/store";

export function useRequest() { return store; }

export const setRequest = (value: any) => { store.value = value; };
