import theme from "#config/theme";

export function computeNav(path: string) {
  const flattened = theme.sidebar.flatMap(item => item.items);
  const index = flattened.findIndex(item => item.href === path);
  return {
    previous: flattened[index - 1],
    next: flattened[index + 1],
  };
}
