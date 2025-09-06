<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import t from "#i18n";
import Link from "#component/Link.vue";

interface Post { id?: string | number; [k: string]: any }

const props = withDefaults(
  defineProps<{ posts?: Post[]; title?: string }>(),
  { posts: () => [], title: "" }
);

const count = ref(0);

onMounted(async () => {
  // wait for hydration to complete before DOM manipulation
  await nextTick();

  // only run on client
  if (typeof window !== "undefined") {
    document.title = "Primate Vue app";
    updateMetaKeywords(props.title ?? "");
  }
});

// watch for title changes, but only update DOM on client
watch(() => props.title, (newTitle) => {
  if (typeof window !== "undefined") {
    updateMetaKeywords(newTitle ?? "");
  }
}, { flush: "post" }); // run after DOM updates

function updateMetaKeywords(content: string) {
  if (typeof window === "undefined") return;

  const name = "keywords";
  let meta = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}
</script>

<template>
  <a href="/redirect">redirect</a>
  <h1 @click="() => console.log('clicked!')">
    {{ t("all_posts") }}
  </h1>
  <Link v-for="(post, i) in props.posts" :key="post.id ?? i" :post="post" />
  <h3>{{ t("counter") }}</h3>
  <div>
    <button @click="count--">-</button>
    <button @click="count++">+</button>
    {{ count }}
  </div>
  <h3>{{ t("switch_language") }}</h3>
  <button @click="t.locale.set('en-US')">{{ t("english") }}</button>
  <button @click="t.locale.set('de-DE')">{{ t("german") }}</button>
  <p>Current locale: {{ t.locale.get() }}</p>
</template>
