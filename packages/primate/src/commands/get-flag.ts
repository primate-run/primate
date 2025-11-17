export default function get_flag(flags: string[], option: string) {
  const flag = `--${option}=`;
  return flags.find(f => f.startsWith(flag))?.slice(flag.length);
}
