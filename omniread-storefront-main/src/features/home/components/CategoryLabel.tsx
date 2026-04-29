/* Copyright (c) 2026, Yao Zeran
 * 
 * The book category label */


import Link from "next/link";
import Image from "next/image";

import styles from "./CategoryLabel.module.css";

import { Category } from "@/types/book";


function CategoryLabel ({ category }: Readonly<{ category: Category }>) {

  const href = `/category/${category.name.toLowerCase()}`;
  const imageSrc = category.image ?? "/sample/cover/dune-cover.jpg";

  return (
    <Link href={href} className={styles.link}>
      <h4 className={styles.title}>
        {category.name}
      </h4>
      <Image
        src={imageSrc}
        alt={category.name}
        width={96}
        height={96}
        unoptimized
        className={styles.image}
      />
    </Link>
  );
};


export default CategoryLabel;
