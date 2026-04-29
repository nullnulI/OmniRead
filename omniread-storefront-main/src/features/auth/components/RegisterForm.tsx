/* Copyright (c) 2026, Yao Zeran
 * 
 * The user account registration form component */


"use client"


import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./RegisterForm.module.css";

import { registerWithEmail } from "@/services/api/auth";
import { useAuthContext } from "@/features/auth/context/AuthProvider";


function RegisterForm() {

  const { setUser } = useAuthContext();

  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRegistering(true);
    setError(null);
    try {
      const user = await registerWithEmail({
        name,
        email,
        password,
      });
      setUser(user);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register: wrong verification code.");
    } finally {
      setRegistering(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          placeholder="Your display name"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          placeholder="you@example.com"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          placeholder="Your password"
        />
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <button
        type="submit"
        disabled={registering}
        className={styles.submitButton}
      >
        {registering ? "Registering..." : "Create account"}
      </button>

    </form>
  )
}


export default RegisterForm;
