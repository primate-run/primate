export default {
  blog: true,
  description: "The universal web framework",
  theme: {
    links: [
      { href: "/chat", icon: "chat" },
      { href: "https://x.com/primate_run", icon: "x" },
      { href: "https://github.com/primate-run/primate", icon: "github" },
    ],
    navbar: [
      { label: "Docs", link: "/docs" },
      { label: "Guides", link: "/guides" },
      { label: "Blog", link: "/blog" },
    ],
    sidebar: [
      {
        items: [
          {
            href: "/",
            title: "What is Primate?",
          },
          {
            href: "/quickstart",
            title: "Quickstart",
          },
          {
            href: "/project-structure",
            title: "Project Structure",
          },
          {
            href: "/configuration",
            title: "Configuration",
          },
        ],
        title: "Intro",
      },
      {
        items: [
          {
            href: "/routing",
            title: "Routing",
          },
          {
            href: "/requests",
            title: "Requests",
          },
          {
            href: "/responses",
            title: "Responses",
          },
          {
            href: "/views",
            title: "Views",
          },
          {
            href: "/validation",
            title: "Validation",
          },
          {
            href: "/sessions",
            title: "Sessions",
          },
          {
            href: "/stores",
            title: "Stores",
          },
          {
            href: "/i18n",
            title: "I18N",
          },
        ],
        title: "Framework",
      },
      {
        items: [{
          href: "/frontend",
          title: "Intro",
        }].concat(...[
          "Angular",
          "Eta",
          "Handlebars",
          "HTML",
          "HTMX",
          "Markdown",
          "Marko",
          "React",
          "Solid",
          "Svelte",
          "Voby",
          "Vue",
          "Web Components",
        ].toSorted().map(title => ({
          href: `/frontend/${title.replaceAll(" ", "-").toLowerCase()}`,
          title,
        }))),
        title: "Frontends",
      },
      {
        items: [{
          href: "/backend",
          title: "Intro",
        }].concat(...[
          "Go",
          "Python",
          "Ruby",
        ].toSorted().map(title => ({
          href: `/backend/${title.replaceAll(" ", "-").toLowerCase()}`,
          title,
        }))),
        title: "Backends",
      },
      {
        items: [{
          href: "/database",
          title: "Intro",
        }].concat(...[
          "MongoDB",
          "MySQL",
          "PostgreSQL",
          "SQLite",
          "SurrealDB",
        ].toSorted().map(title => ({
          href: `/database/${title.replaceAll(" ", "-").toLowerCase()}`,
          title,
        }))),
        title: "Databases",
      },
      {
        href: "/platform",
        items: [
          {
            href: "/platform",
            title: "Intro",
          },
          {
            href: "/target/web",
            title: "Web",
          },
          {
            href: "/target/native",
            title: "Native",
          },
        ],
        title: "Platforms",
      },
    ],
  },
  title: "Primate",
};
