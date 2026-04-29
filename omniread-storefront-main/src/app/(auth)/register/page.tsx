/* Copyright (c) 2026, Yao Zeran
 *
 * Register page with email verification and role selection. */


"use client";


import RegisterSection from "@/features/auth/components/RegisterSection";


function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <RegisterSection/>
    </main>
  );
}


export default RegisterPage;
