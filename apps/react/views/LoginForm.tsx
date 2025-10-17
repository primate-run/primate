import { useState } from "react";

interface Props {}

export default function LoginForm(props: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email must be valid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Handle success
        console.log("Login successful");
      } else {
        // Handle error
        console.error("Login failed");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "400px", margin: "2rem auto" }}>
      <h2>Login</h2>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "1rem"
          }}
        />
        {errors.email && <p style={{ color: "red", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.email}</p>}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "1rem"
          }}
        />
        {errors.password && <p style={{ color: "red", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.password}</p>}
      </div>

      <button
        type="submit"
        disabled={!email || !password}
        style={{
          width: "100%",
          padding: "0.75rem",
          backgroundColor: (!email || !password) ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "1rem",
          cursor: (!email || !password) ? "not-allowed" : "pointer"
        }}
      >
        Submit
      </button>
    </form>
  );
}