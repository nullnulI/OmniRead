/* Copyright (c) 2026, Yao Zeran
 *
 * Login page for email/password authentication. */

 
"use client";


import LoginSection from "@/features/auth/components/LoginSection";


function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <LoginSection/>
    </main>
  );
}


export default LoginPage;
