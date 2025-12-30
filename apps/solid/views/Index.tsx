import Link from "#component/Link";
import type Post from "#component/Post";
import t from "#i18n";
import Head from "@primate/solid/Head";
import { createSignal, For } from "solid-js";

type Props = {
  posts: Post[];
  title: string;
};

export default function Index({ posts, title }: Props) {
  const [count, setCount] = createSignal(0);

  return <>
    <Head>
      <title>Primate Solid app</title>
      <meta name="keywords" content={title} />
    </Head>
    <h1 onClick={() => { console.log("clicked!"); }}>{t("all_posts")}</h1>
    <For each={posts}>
      {(post) => <Link post={post} />}
    </For>
    <h3>{t("counter")}</h3>
    <div>
      <button onClick={(() => setCount(n => n - 1))}>-</button>
      <button onClick={(() => setCount(n => n + 1))}>+</button>
      {count()}
    </div>
    <h3>{t("switch_language")}</h3>
    <div>
      <button disabled={t.loading} onClick={() => t.locale.set("en-US")}>{t("english")}</button>
      <button disabled={t.loading} onClick={() => t.locale.set("de-DE")}>{t("german")}</button>
      <p>Current locale: {t.locale.get()}</p>
    </div>
  </>;
};
