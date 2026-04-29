/* Copyright (c) 2026, Yao Zeran
 *
 * Default unauthorization page. */


"use client";


import UnauthorizedSection from "@/features/auth/components/UnauthorizedSection";


function UnauthorizedPage() {
  return (
    <main className="min-h-[60vh] grid place-items-center py-8 px-4">
      <UnauthorizedSection/>
    </main>
  );
}


export default UnauthorizedPage;
