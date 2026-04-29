/* Copyright (c) 2026, Yao Zeran
 * 
 * The user login form component */


"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./LoginForm.module.css";

import { useAuthContext } from "@/features/auth/context/AuthProvider";

import { loginWithEmail } from "@/services/api/auth";


function LoginForm() {

  const { setUser } = useAuthContext();

  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await loginWithEmail({ email, password });
      setUser(user);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to login");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form className={styles.form} onSubmit={onSubmit}>

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
          placeholder="Enter your password"
        />
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <button type="submit" disabled={loading} className={styles.button}>
        {loading ? "Logging in..." : "Login"}
      </button>
      
    </form>
  )
}


export default LoginForm;
