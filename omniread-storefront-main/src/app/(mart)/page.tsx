/* Copyright (c) 2026, Yao Zeran
 * 
 * The home page of the book mart, it consists of the following sections
 *   the trending book 
 *   the recommened book for user
 *   the search by categories section  */


import CategorySection from "@/features/home/components/CategorySection";
import RecommendedSection from "@/features/home/components/RecommendationSection";
import TrendingSection from "@/features/home/components/TrendingSection";


async function Home() {
  return (
    <main className="flex flex-col gap-6 px-4 py-6 md:px-6 md:py-8">

      <TrendingSection />

      <RecommendedSection />
        
      <CategorySection />
      
    </main>
  );
}


export default Home;
