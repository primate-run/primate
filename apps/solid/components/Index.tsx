import Link from "#component/Link";
import type Post from "#component/Post";
import Head from "@primate/solid/Head";
import t from "@primate/solid/i18n";
import locale from "@primate/solid/locale";
import { createSignal } from "solid-js";
import { For } from "solid-js/web";

type Props = {
  posts: Post[];
  title: string;
};

export default ({ posts, title }: Props) => {
  const [count, setCount] = createSignal(0);

  return <>
    <Head>
      <title>Primate Solid app</title>
      <meta name="keywords" content={title} />
    </Head>
    <h1 onClick={() => { console.log("clicked!"); }}>{t("All posts")}</h1>
    <For each={posts}>
      {(post) => <Link post={post} />}
    </For>
    <h3>{t("Counter")}</h3>
    <div>
      <button onClick={(() => setCount(n => n - 1))}>-</button>
      <button onClick={(() => setCount(n => n + 1))}>+</button>
      {count()}
    </div>
    <h3>{t("Switch language")}</h3>
    <div><a onClick={() => locale.set("en-US")}>{t("English")}</a></div>
    <div><a onClick={() => locale.set("de-DE")}>{t("German")}</a></div>
  </>;
};
