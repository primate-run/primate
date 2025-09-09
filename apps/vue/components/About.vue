<script lang="ts" setup>
import { onMounted } from "vue";

onMounted(() => {
  document.title = "About Us - Primate Vue Demo";

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute("content", "Learn more about our company and mission");
  } else {
    const meta = document.createElement("meta");
    meta.name = "description";
    meta.content = "Learn more about our company and mission";
    document.head.appendChild(meta);
  }

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute("content", "About Us - Primate Vue Demo");
  } else {
    const meta = document.createElement("meta");
    meta.setAttribute("property", "og:title");
    meta.content = "About Us - Primate Vue Demo";
    document.head.appendChild(meta);
  }
});
</script>

<template>
  <div style="max-width: 800px; margin: 2rem auto; padding: 0 1rem;">
    <h1>About Us</h1>
    <p>
      Welcome to our Primate Vue demo application. This page demonstrates
      how to manage document head elements including the title and meta tags
      for better SEO and social media sharing.
    </p>

    <h2>Our Mission</h2>
    <p>
      We are committed to providing excellent examples of modern web development
      with Primate and Vue. Our goal is to make full-stack development
      easier and more efficient.
    </p>

    <h2>Features Demonstrated</h2>
    <ul>
      <li>Server-side rendering (SSR)</li>
      <li>Hydration</li>
      <li>SPA navigation</li>
      <li>Form validation</li>
      <li>Head management</li>
      <li>Internationalization (i18n)</li>
      <li>Database integration</li>
    </ul>
  </div>
</template>
