import Head from "@primate/solid/Head";

export default function About() {
  return (
    <div style={{ "max-width": "800px", margin: "2rem auto", padding: "0 1rem" }}>
      <Head>
        <title>About Us - Primate Solid Demo</title>
        <meta name="description" content="Learn more about our company and mission" />
        <meta property="og:title" content="About Us - Primate Solid Demo" />
        <meta property="og:description" content="Learn more about our company and mission" />
        <meta property="og:type" content="website" />
      </Head>

      <h1>About Us</h1>
      <p>
        Welcome to our Primate Solid demo application. This page demonstrates
        how to manage document head elements including the title and meta tags
        for better SEO and social media sharing.
      </p>

      <h2>Our Mission</h2>
      <p>
        We are committed to providing excellent examples of modern web development
        with Primate and Solid. Our goal is to make full-stack development
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
  );
}
