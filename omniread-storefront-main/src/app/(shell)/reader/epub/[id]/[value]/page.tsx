/* Copyright (c) 2026 Yao Zeran
 * 
 * The reader page. */


import type { EpubIdentifier } from "@/types/epub";
import EpubReader from "@/features/reader/components/EpubReader";



async function ReaderPage(
  { params }: Readonly<{ params : Promise<{ id : string, value: string }> }>
) {
  const { id, value } = await params;

  const identifier: EpubIdentifier = {
    id,
    value,
  }
  
  return <EpubReader identifier={identifier} />;
}


export default ReaderPage;
