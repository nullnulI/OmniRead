/* Copyright (c) 2026 Yao Zeran
 * 
 * The user info section used in the user space page. */


"use client";

import { useAuthContext } from "@/features/auth/context/AuthProvider";

import UserCard from "@/features/space/components/UserCard";


const UserInfoSection = () => {

  const { user } = useAuthContext();

  return (
    <section className="mb-8">
      <UserCard user={user} />
    </section>
  );
};


export default UserInfoSection;
