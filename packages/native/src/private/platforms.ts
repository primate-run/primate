import runner from "#desktop";
import type NativePlatform from "#NativePlatform";

const platforms: NativePlatform[] = [
  {
    name: "linux-x64",
    target: "linux-x64",
    runner,
    flags: "--target=bun-linux-x64",
    exe: "app",
  },
  {
    name: "windows-x64",
    target: "windows-x64",
    runner,
    flags: "--target=bun-windows-x64",
    exe: "app.exe",
  },
  {
    name: "darwin-x64",
    target: "darwin-x64",
    runner,
    flags: "--target=bun-darwin-x64",
    exe: "app",
  },
  {
    name: "darwin-arm64",
    target: "darwin-arm64",
    runner,
    flags: "--target=bun-darwin-arm64",
    exe: "app",
  },
];

platforms.push({
  ...platforms.find(platform =>
    platform.target === `${process.platform}-${process.arch}`)!,
  name: "desktop",
});

export default platforms;
