"use client";

import { useAuthContext } from "@/features/auth/context/AuthProvider";


function UserRoleSection() {
  const { user } = useAuthContext();
  const roleLabel = user?.metadata.role ?? "CUSTOMER";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Account Role</p>
      <h2 className="mt-1 text-2xl font-semibold text-slate-900">{roleLabel}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Roles are assigned by OmniRead backend RBAC for this MVP.
      </p>
    </section>
  );
}


export default UserRoleSection;
