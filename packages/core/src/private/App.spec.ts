import App from "#App";
import config from "#config/index";
import FileRef from "@rcompat/fs/FileRef";
import test from "@rcompat/test";

const root = new FileRef("/test/project");
const testConfig = config({
  modules: [],
});

class TestApp extends App {
  constructor() {
    super(root, testConfig, "testing");
    this.bind(".component.ts", () => "");
    this.bind(".vue", () => "");
    this.bind(".svelte", () => "");
  }
}

test.case("basename - routes with brackets", assert => {
  const app = new TestApp();
  const file = root.join("routes/repo/[...path].ts");
  const directory = root.join("routes");

  const result = app.basename(file, directory);

  assert(result).equals("repo/[...path]");
});

test.case("basename - routes with double brackets", assert => {
  const app = new TestApp();
  const file = root.join("routes/post/[[id]].ts");
  const directory = root.join("routes");

  const result = app.basename(file, directory);

  assert(result).equals("post/[[id]]");
});

test.case("basename - routes simple", assert => {
  const app = new TestApp();
  const file = root.join("routes/index.ts");
  const directory = root.join("routes");

  const result = app.basename(file, directory);

  assert(result).equals("index");
});

test.case("basename - component with compound extension", assert => {
  const app = new TestApp();
  const file = root.join("components/Link.component.ts");
  const directory = root.join("components");

  const result = app.basename(file, directory);

  assert(result).equals("Link");
});

test.case("basename - component in subdirectory", assert => {
  const app = new TestApp();
  const file = root.join("components/ui/Button.component.ts");
  const directory = root.join("components");

  const result = app.basename(file, directory);

  assert(result).equals("ui/Button");
});

test.case("basename - vue component", assert => {
  const app = new TestApp();
  const file = root.join("components/Card.vue");
  const directory = root.join("components");

  const result = app.basename(file, directory);

  assert(result).equals("Card");
});

test.case("basename - svelte component", assert => {
  const app = new TestApp();
  const file = root.join("components/Header.svelte");
  const directory = root.join("components");

  const result = app.basename(file, directory);

  assert(result).equals("Header");
});

test.case("basename - store with simple extension", assert => {
  const app = new TestApp();
  const file = root.join("stores/Counter.ts");
  const directory = root.join("stores");

  const result = app.basename(file, directory);

  assert(result).equals("Counter");
});

test.case("basename - store in subdirectory", assert => {
  const app = new TestApp();
  const file = root.join("stores/user/Profile.ts");
  const directory = root.join("stores");

  const result = app.basename(file, directory);

  assert(result).equals("user/Profile");
});

test.case("basename - js file fallback", assert => {
  const app = new TestApp();
  const file = root.join("hooks/useData.js");
  const directory = root.join("hooks");

  const result = app.basename(file, directory);

  assert(result).equals("useData");
});

test.case("basename - unregistered extension uses fallback", assert => {
  const app = new TestApp();
  const file = root.join("components/Custom.xyz");
  const directory = root.join("components");

  const result = app.basename(file, directory);

  assert(result).equals("Custom");
});
