import type NativeTarget from "#NativeTarget";

const runner = () => { };

const targets: NativeTarget[] = [
  {
    exe: "app",
    flags: "--target=bun-linux-x64",
    name: "linux-x64",
    runner,
    target: "linux-x64",
  },
  {
    exe: "app.exe",
    flags: "--target=bun-windows-x64",
    name: "windows-x64",
    runner,
    target: "windows-x64",
  },
  {
    exe: "app",
    flags: "--target=bun-darwin-x64",
    name: "darwin-x64",
    runner,
    target: "darwin-x64",
  },
  {
    exe: "app",
    flags: "--target=bun-darwin-arm64",
    name: "darwin-arm64",
    runner,
    target: "darwin-arm64",
  },
];

targets.push({
  ...targets.find(t => t.target === `${process.platform}-${process.arch}`)!,
  name: "desktop",
});

export default targets;
