interface Counter {
  count: number;
}

export const counter = $state<Counter>({
  count: 0,
});
