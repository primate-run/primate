<script lang="ts" setup>
import { ref, computed } from "vue";

const email = ref("");
const password = ref("");
const errors = ref<{email?: string; password?: string}>({});

const isFormValid = computed(() => email.value && password.value);

const validateForm = () => {
  errors.value = {};

  if (!email.value) {
    errors.value.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    errors.value.email = "Email must be valid";
  }

  if (!password.value) {
    errors.value.password = "Password is required";
  } else if (password.value.length < 8) {
    errors.value.password = "Password must be at least 8 characters";
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async (e: Event) => {
  e.preventDefault();

  if (!validateForm()) return;

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.value, password: password.value }),
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
</script>

<template>
  <form @submit="handleSubmit" style="max-width: 400px; margin: 2rem auto;">
    <h2>Login</h2>

    <div style="margin-bottom: 1rem;">
      <input
        type="email"
        placeholder="Email"
        v-model="email"
        style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;"
      />
      <p v-if="errors.email" style="color: red; font-size: 0.875rem; margin-top: 0.25rem;">
        {{ errors.email }}
      </p>
    </div>

    <div style="margin-bottom: 1rem;">
      <input
        type="password"
        placeholder="Password"
        v-model="password"
        style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;"
      />
      <p v-if="errors.password" style="color: red; font-size: 0.875rem; margin-top: 0.25rem;">
        {{ errors.password }}
      </p>
    </div>

    <button
      type="submit"
      :disabled="!isFormValid"
      :style="{
        width: '100%',
        padding: '0.75rem',
        backgroundColor: isFormValid ? '#007bff' : '#ccc',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '1rem',
        cursor: isFormValid ? 'pointer' : 'not-allowed'
      }"
    >
      Submit
    </button>
  </form>
</template>