"use client";

import { useId, useRef, useState } from "react";

/**
 * A search box over the scheduled-employment list. The list is server
 * rendered and complete without JavaScript; this only hides the entries
 * whose `data-search` text does not contain every word typed.
 */
export function EmploymentFinder({ label, hint, noMatch, children }: { label: string; hint: string; noMatch: string; children: React.ReactNode }) {
  const id = useId();
  const list = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(false);

  function filter(query: string) {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const item of list.current?.querySelectorAll<HTMLElement>("[data-search]") ?? []) {
      const match = words.every((w) => (item.dataset.search ?? "").includes(w));
      item.hidden = !match;
      if (match) shown++;
    }
    setEmpty(shown === 0);
  }

  return (
    <div className="wage-emp-finder">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="search" placeholder={hint} autoComplete="off" onChange={(e) => filter(e.target.value)} />
      <div ref={list}>{children}</div>
      {empty && (
        <p className="wage-note" role="status">
          {noMatch}
        </p>
      )}
    </div>
  );
}
