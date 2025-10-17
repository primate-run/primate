<script lang="ts">
  let email = "";
  let password = "";
  let errors: {email?: string; password?: string} = {};

  function validateForm() {
    errors = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email must be valid";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        console.log("Login successful");
      } else {
        console.error("Login failed");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  }
</script>

<form on:submit={handleSubmit} style="max-width: 400px; margin: 2rem auto;">
  <h2>Login</h2>

  <div style="margin-bottom: 1rem;">
    <input
      type="email"
      placeholder="Email"
      bind:value={email}
      style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;"
    />
    {#if errors.email}
      <p style="color: red; font-size: 0.875rem; margin-top: 0.25rem;">{errors.email}</p>
    {/if}
  </div>

  <div style="margin-bottom: 1rem;">
    <input
      type="password"
      placeholder="Password"
      bind:value={password}
      style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;"
    />
    {#if errors.password}
      <p style="color: red; font-size: 0.875rem; margin-top: 0.25rem;">{errors.password}</p>
    {/if}
  </div>

  <button
    type="submit"
    disabled={!email || !password}
    style="width: 100%; padding: 0.75rem; background-color: {!email || !password ? '#ccc' : '#007bff'}; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: {!email || !password ? 'not-allowed' : 'pointer'};"
  >
    Submit
  </button>
</form>