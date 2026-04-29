/* Copyright (c) 2026, Yao Zeran
 * 
 * The category section that allows user to search books by categories */


import { fetchCategories } from '@/services/api/book';

import CategoryLabel from '@/features/home/components/CategoryLabel';
import styles from './CategorySection.module.css';


async function CategorySection() {

  const categories = await fetchCategories();

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>
        Find by Categories
      </h2>
      <div className={styles.grid}>
        {categories.map((category) => (
          <CategoryLabel key={category.id} category={category}/>
        ))}
      </div>
    </section>
  );
};


export default CategorySection;
