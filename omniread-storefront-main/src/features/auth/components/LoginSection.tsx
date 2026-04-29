/* Copyright (c) 2026, Yao Zeran
 * 
 * The login section component, containing a login form */


import Link from "next/link";

import LoginForm from "./LoginForm";


function LoginSection() {

  const registerHref = "/register";

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
      <p className="mt-1 text-sm text-slate-600">Sign in with your email.</p>
      <LoginForm/>
      <p className="mt-5 text-sm text-slate-600">
        New here?{" "}
        <Link href={registerHref} className="font-medium text-slate-900 underline">
          Create an account
        </Link>
      </p>
    </section>
  )
}


export default LoginSection;
