/* Copyright (c) 2026, Yao Zeran
 *
 * The user card that displays the most basic user info */


import type { User } from "@/types/user";


function UserCard({ user }: Readonly<{ user: User | null }>) {
  if (!user) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Please login</h1>
        <p className="mt-2 text-sm text-slate-600">Your personal space appears after authentication.</p>
      </section>
    );
  }

  const userRoleLabel = user.role === "author" ? "Author" : "Reader";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-orange-50 to-teal-50 p-6 shadow-sm sm:p-8">
      <div className="pointer-events-none absolute -top-14 right-4 h-28 w-28 rounded-full bg-amber-300/30 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 left-2 h-32 w-32 rounded-full bg-teal-300/25 blur-2xl" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Personal Space
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
            {user.name}
          </h1>
          <p className="mt-2 text-sm text-slate-600">{user.email}</p>
        </div>

        <span className="inline-flex w-fit items-center rounded-full border border-slate-900/10 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur">
          {userRoleLabel}
        </span>
      </div>

      {user.role === "reader" ? (
        <div className="relative mt-6 rounded-2xl border border-white/80 bg-white/75 p-4 backdrop-blur">
          <p className="text-sm text-slate-700">
            Following <span className="font-semibold text-slate-900">{user.subscribedAuthors.length}</span> author
            {user.subscribedAuthors.length === 1 ? "" : "s"}.
          </p>
        </div>
      ) : (
        <div className="relative mt-6 rounded-2xl border border-white/80 bg-white/75 p-4 backdrop-blur">
          <p className="text-sm font-medium text-slate-800">
            Pen name: {user.profile?.role === "author" ? user.profile.penName : user.name}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {user.profile?.role === "author" ? user.profile.authorBio : "Reader account"}
          </p>
        </div>
      )}
    </section>
  );
};


export default UserCard;
