<template>
  <h1>All posts</h1>
  <div v-for="post in posts">
    <h2>
      <a :href="`/post/${post.id}`">
        {{post.title}}
      </a>
    </h2>
  </div>
</template>
