/* Copyright (c) 2026 Yao Zeran
 * 
 * The mart pages' header component. */


"use client";


import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import styles from "./MartHeader.module.css";
import { useAuthContext } from "@/features/auth/context/AuthProvider";


function MartHeader() {

  const auth = useAuthContext();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const role = auth.user?.metadata.role;
  const canUseCustomerActions = !auth.isAuthenticated || role === "CUSTOMER";
  const canUseOperations = role === "INVENTORY_ADMIN" || role === "SYSTEM_ADMIN" || role === "SUPPLIER";

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchTerm.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>OmniRead</Link>
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="Search for books"
          className={styles.searchInput}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <button type="submit" className={styles.searchButton}>Search</button>
      </form>
      <div className={styles.linkGroup}>
        <Link href={auth.isAuthenticated ? "/space" : "/login"} className={styles.link}>
          {auth.user?.metadata.name ?? "Login"}
        </Link>
      </div>
      {auth.isAuthenticated ? (
        <button type="button" className={styles.linkButton} onClick={auth.logout}>
          Logout
        </button>
      ) : null}
      {canUseOperations ? (
        <div className={styles.linkGroup}>
          <Link href="/operations" className={styles.link}>
            Operations
          </Link>
        </div>
      ) : null}
      {canUseCustomerActions ? (
        <>
          <div className={styles.linkGroup}>
            <Link href="/orders" className={styles.link}>
              Orders
            </Link>
          </div>
          <div className={styles.linkGroup}>
            <Link href="/cart" className={styles.link}>
              Cart
            </Link>
          </div>
        </>
      ) : null}
    </header>
  )
}


export default MartHeader;
