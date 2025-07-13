import Head from "@primate/react/Head";
import t from "@primate/react/i18n";
import locale from "@primate/react/locale";
import { useState } from "react";
import Link from "./Link.jsx";

export default ({ posts, title, request }) => {
  const [count, setCount] = useState(0);
  return <>
    <Head>
      <title>Primate React app</title>
      <meta name="keywords" content={title} />
    </Head>
    <h1 onClick={() => { console.log("clicked!"); }}>{t("All posts")}</h1>
    {posts.map((post, i) => <Link key={i} post={post} />)}
    <h3>{t("Counter")}</h3>
    <div>
      <button onClick={(() => setCount(count => count - 1))}>-</button>
      <button onClick={(() => setCount(count => count + 1))}>+</button>
      {count}
    </div>
    <h3>{t("Switch language")}</h3>
    <div><a onClick={() => locale.set("en-US")}>{t("English")}</a></div>
    <div><a onClick={() => locale.set("de-DE")}>{t("German")}</a></div>
  </>;
}
