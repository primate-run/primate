import Link from "#component/Link";
import type Post from "#component/Post";
import t from "#i18n";
import Head from "@primate/react/Head";
import { useState } from "react";

type Props = {
  posts: Post[];
  title: string;
};

export default ({ posts, title }: Props) => {
  const [count, setCount] = useState(0);
  return <>
    <Head>
      <title>Primate React app</title>
      <meta name="keywords" content={title} />
    </Head>
    <h1 onClick={() => { console.log("clicked!"); }}>{t("all_posts")}</h1>
    {posts.map((post, i) => <Link key={i} post={post} />)}
    <h3>{t("counter")}</h3>
    <div>
      <button onClick={(() => setCount(n => n - 1))}>-</button>
      <button onClick={(() => setCount(n => n + 1))}>+</button>
      {count}
    </div>
    <h3>{t("switch_language")}</h3>
    <div>
      <button disabled={t.loading} onClick={() => t.locale.set("en-US")}>{t("english")}</button>
      <button disabled={t.loading} onClick={() => t.locale.set("de-DE")}>{t("german")}</button>
      <p>Current locale: {t.locale.get()}</p>
    </div>
  </>;
};
