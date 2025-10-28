import { createSignal } from "solid-js";

export default function LoginForm() {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [errors, setErrors] = createSignal<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email())) {
      newErrors.email = "Email must be valid";
    }

    if (!password()) {
      newErrors.password = "Password is required";
    } else if (password().length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email(), password: password() }),
      });

      if (response.ok) {
        console.log("Login successful");
      } else {
        console.error("Login failed");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ "max-width": "400px", margin: "2rem auto" }}>
      <h2>Login</h2>

      <div style={{ "margin-bottom": "1rem" }}>
        <input
          type="email"
          placeholder="Email"
          value={email()}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            "border": "1px solid #ccc",
            "border-radius": "4px",
            "font-size": "1rem",
          }}
        />
        {errors().email && <p style={{ color: "red", "font-size": "0.875rem", "margin-top": "0.25rem" }}>{errors().email}</p>}
      </div>

      <div style={{ "margin-bottom": "1rem" }}>
        <input
          type="password"
          placeholder="Password"
          value={password()}
          onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            "border": "1px solid #ccc",
            "border-radius": "4px",
            "font-size": "1rem",
          }}
        />
        {errors().password && <p style={{ color: "red", "font-size": "0.875rem", "margin-top": "0.25rem" }}>{errors().password}</p>}
      </div>

      <button
        type="submit"
        disabled={!email() || !password()}
        style={{
          width: "100%",
          padding: "0.75rem",
          "background-color": (!email() || !password()) ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          "border-radius": "4px",
          "font-size": "1rem",
          cursor: (!email() || !password()) ? "not-allowed" : "pointer",
        }}
      >
        Submit
      </button>
    </form>
  );
}
