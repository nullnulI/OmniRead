/* Copyright (c) 2026 Yao Zeran
 * 
 * The user space page. */


import CartSection from "@/features/space/components/CartSection";
import BookshelfSection from "@/features/space/components/BookshelfSection";
import MailboxSection from "@/features/space/components/MailboxSection";
import UserInfoSection from "@/features/space/components/UserInfoSection";
import UserPostSection from "@/features/space/components/UserPostSection";


function UserSpacePage() {
  return (
    <main className="w-full px-4 py-6 md:px-6 md:py-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

        <div className="space-y-6">
          <UserInfoSection />
          <BookshelfSection />
          <UserPostSection />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <MailboxSection />
          <CartSection/>
        </aside>
        
      </div>
    </main>
  );
};


export default UserSpacePage;
