/* Copyright (c) 2026 Yao Zeran
 * 
 * The mart pages' footer component. */


import Link from "next/link";

import styles from "./MartFooter.module.css";

import { fetchCategories } from "@/services/api/book";


const Twitter = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={styles.icon}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.658l-5.226-6.828-5.976 6.828H1.658l7.73-8.84L1.233 2.25h6.827l4.713 6.231 5.471-6.231Zm-1.16 17.718h1.833L7.064 4.126H5.098l11.986 15.842Z" />
  </svg>
);


const Instagram = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={styles.icon}
  >
    <path d="M7 2.5A4.5 4.5 0 0 0 2.5 7v10A4.5 4.5 0 0 0 7 21.5h10A4.5 4.5 0 0 0 21.5 17V7A4.5 4.5 0 0 0 17 2.5H7Zm10 2A2.5 2.5 0 0 1 19.5 7v10A2.5 2.5 0 0 1 17 19.5H7A2.5 2.5 0 0 1 4.5 17V7A2.5 2.5 0 0 1 7 4.5h10Zm-5 2.75A4.75 4.75 0 1 0 16.75 12 4.76 4.76 0 0 0 12 5.25Zm0 2A2.75 2.75 0 1 1 9.25 10 2.75 2.75 0 0 1 12 7.25Zm5.5-2.5a1.25 1.25 0 1 0 1.25 1.25 1.25 1.25 0 0 0-1.25-1.25Z" />
  </svg>
);


const Mail = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={styles.icon}
  >
    <path d="M4 5.5A2.5 2.5 0 0 0 1.5 8v8A2.5 2.5 0 0 0 4 18.5h16A2.5 2.5 0 0 0 22.5 16V8A2.5 2.5 0 0 0 20 5.5H4Zm16 2-8 5.25L4 7.5h16ZM4 16.5V9.02l7.45 4.89a1 1 0 0 0 1.1 0L20 9.02v7.48H4Z" />
  </svg>
);


async function MartFooter() {

  const categories = await fetchCategories();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>

        <div className={styles.layout}>

          <div className={styles.brandGroup}>
            <div>
              <h3 className={styles.heading}>Book Store</h3>
              <p className={styles.description}>
                Your favorite place to find and read books.
              </p>
            </div>
            <div>
              <h3 className={styles.heading}>Categories</h3>
              <ul className={styles.categoriesList}>
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/home?category=${category.name}`}
                      className={styles.categoryLink}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.contactGroup}>
            <h3 className={styles.heading}>Contact Us</h3>
            <div className={styles.socialLinks}>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} >
                <Twitter />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                <Instagram />
              </a>
              <a href="mailto:support@bookstore.com" className={styles.socialLink}>
                <Mail />
              </a>
            </div>
          </div>

        </div>

        <div className={styles.meta}>
          <p>&copy; 2026 Book Store. All rights reserved.</p>
          <p>Built by Yao Zeran</p>
        </div>
        
      </div>
    </footer>
  );
};


export default MartFooter;
