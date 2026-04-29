
"use client";


import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";

import { useAuthContext } from "../context/AuthProvider";

import RegisterForm from "./RegisterForm";


function RegisterSection() {

  const router = useRouter();

  const auth = useAuthContext();

  useEffect(() => {
    if (auth.user) router.replace("/space");
  }, [auth.user, router]);

  if (auth.user) { return null; }
  
  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Register</h1>
      <p className="mt-1 text-sm text-slate-600">Create your account with email verification.</p>
      <RegisterForm/>
      <p className="mt-5 text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-slate-900 underline">
          Login
        </Link>
      </p>
    </section>
  )
}


export default RegisterSection;
