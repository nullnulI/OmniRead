/* Copyright (c) 2026 Yao Zeran
 * 
 * The ToC component. */


import type { EpubNavigationPoint } from "@/types/epub";


function ToC({
  items,
  onGoTo,
}: Readonly<{
  items: EpubNavigationPoint[];
  onGoTo?: (href: string) => void;
}>) {
  return items.map(item => (
    <div key={item.href || item.label}>
      <button type="button" onClick={() => onGoTo?.(item.href)}>
        {item.label}
      </button>

      {item.children && (
        <div style={{ paddingLeft: 16 }}>
          <ToC items={item.children} onGoTo={onGoTo} />
        </div>
      )}
    </div>
  ))
}


export default ToC;
