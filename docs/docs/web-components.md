# Web Components

Custom HTML elements.

## Support matrix

|Extension|Props|Server-side rendering|Hydration|Layouts|Head component|I18N|
|-|-|-|-|-|-|-|
|`.webc`|✓|[✗]|[✗]|[✗]|[✗]|[✗]|

## Install

```sh
npm install @primate/webc
```

## Configure

```js caption=primate.config.js
import webc from "@primate/webc";

export default {
  modules: [
    webc(/* configuration */),
  ],
};
```

## Use

Create a web component in `components`.

```html caption=components/post-index.webc
<script>
  import Component from "@primate/webc/Component";
  import PostLink from "./post-link.webc";

  export default class PostIndex extends Component {
    mounted(root) {
      root.querySelector("h1").addEventListener("click",
        _ => console.log("title clicked!"));
    }

    render() {
      const { posts } = this.props;

      return `<h1>All posts</h1>
        ${posts.map(post => new PostLink({post})).join("")}
     `;
    }
  }
</script>
```

And another component for displaying post links.

```html caption=components/post-link.webc
<script>
  import Component from "@primate/webc/Component";

  export default class PostLink extends Component {
    render() {
      const { post } = this.props;
      return `<h2><a href="/post/view/${post.id}">${post.title}</a></h2>`;
    }
  }
</script>
```

```js caption=routes/webc.js
import view from "primate/handler/view";

const posts = [{
  id: 1,
  title: "First post",
}];

export default {
  get() {
    return view("post-index.webc", { posts });
  },
};
```

## Configuration

### extension

Default `".webc"`

The file extension associated with web components.

## Resources

* [Repository][repo]
* [Error list](/errors/webc)

[repo]: https://github.com/primatejs/primate/tree/master/packages/webc
[✗]: https://github.com/primatejs/primate/issues/164
